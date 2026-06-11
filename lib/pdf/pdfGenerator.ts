
import { PDFDocument, rgb, StandardFonts } from 'pdf-lib';
import { DocumentTemplate } from '@/types/form';

export async function generateFilledPDF(template: DocumentTemplate, formData: any, backgroundImageUrl: string): Promise<Uint8Array> {
    // 1. Create a new PDF Document
    const pdfDoc = await PDFDocument.create();

    // 2. Embed the background image
    const imageBytes = await fetch(backgroundImageUrl).then(res => res.arrayBuffer());

    // Detect image type (simple check)
    // In a real app we might rely on content-type or try-catch
    let bgImage;
    if (backgroundImageUrl.startsWith('data:image/png') || backgroundImageUrl.toLowerCase().endsWith('.png')) {
        bgImage = await pdfDoc.embedPng(imageBytes);
    } else {
        bgImage = await pdfDoc.embedJpg(imageBytes); // Fallback to JPG
    }

    const { width, height } = bgImage;

    // 3. Add a page with the image size
    const page = pdfDoc.addPage([width, height]);

    // 4. Draw the background image
    page.drawImage(bgImage, {
        x: 0,
        y: 0,
        width: width,
        height: height,
    });

    // 5. Draw Fields
    // Setup font
    const helveticaFont = await pdfDoc.embedFont(StandardFonts.Helvetica);
    const fontSize = 10; // Base font size

    // Flatten fields
    const allFields = template.schema.sections.flatMap(s => s.fields);

    for (const field of allFields) {
        if (!field.coordinates) continue;

        const value = formData[field.id] || "";
        const textToDraw = String(value);

        // Coordinate transformation
        // PDF Coordinates: (0,0) is BOTTOM-LEFT.
        // Web/Canvas Coordinates: (0,0) is TOP-LEFT.
        // So PDF_Y = Box_Height - Web_Y - Element_Height (if anchoring top-left)
        // Actually, field.coordinates.y is the "top" style property.
        // So PDF_Y = PageHeight - field.coordinates.y - field.coordinates.height (to align bottom) OR
        // PDF DrawText starts at baseline-ish. 
        // Simplest: PDF_Y = PageHeight - field.coordinates.y - (font_height_approx).

        // ISSUE: user scaled the image to 100% width on screen. The 'coordinates' are pixels relative to that 100% width display?
        // OR did we save coordinates relative to the "natural size"?
        // In PDFMapper: 
        //  <div className="relative inline-block" ...> <img src... /> </div>
        // If the 'inline-block' div assumes the size of the image, and the image has "max-width: 100%", the DIV matches the Rendered Image size, NOT the natural size.
        // So the coordinates saved are "Rendered Screen Pixels".
        // BUT the PDF Generation uses "Image Natural Pixels".
        // WE NEED A SCALE FACTOR.

        // This is a critical realization.
        // If I map on a 800px wide screen (image rendered at 800px), x=400 is center.
        // If image natural width is 2400px.
        // On PDF (2400px wide), x=400 is way left. It should be 1200.

        // FIX: We need to know the "Rendered Width" at the time of mapping to calculate Scale.
        // OR better: Store coordinates as PERCENTAGES?
        // OR: Store the `naturalWidth` of the image in the Template or asking user?
        // OR: Infer it?

        // Let's assume for this MVP that the User maps at a certain size, and we might miss-align if we don't handle this.
        // BETTER: In PDFMapper, we should hopefully have access to the "Natural Dimensions" vs "Client Dimensions".
        // If we don't have them in 'template', we are in trouble unless we assume the mapping was done 1:1.
        // Wait, `PDFMapper` forces the image to `max-width: 100%`.
        // If the image is huge, it shrinks. Coords are small.
        // If the image is small, it might stay natural.

        // STRATEGY: 
        // Just generated PDF using the EXACT SAME dimensions as the user saw?
        // We can create a PDF page of size (RenderedWidth, RenderedHeight).
        // But the Background Image embedding usually requires natural size or we scale it down.
        // If we embed the huge image into a small PDF page, it works.

        // BUT we don't know what "RenderedHeight" was when they mapped it!
        // Unless we saved it.
        // Currently `DocumentTemplate` doesn't have `mapSize`.

        // WORKAROUND:
        // We will assume for now that the user wants to print "Exactly what they see".
        // BUT we only have the `coordinates` (x,y).
        // We don't have the context of "Width of container was 1054px".

        // Let's try to handle this in `FormRenderer`:
        // When we generate, we can try to guess or we just accept that without 'percentage' coords, this is fragile.
        // IMPROVEMENT: Start saving coordinates as %.
        // `x_pct = x / rect.width`
        // `y_pct = y / rect.height`

        // Can I change `PDFMapper` to save percentages instead?
        // That would be robust.

        // Let's modify `PDFMapper` to save percentages (0-1) instead of pixels.
        // Then PDF Generator multiplies % by (PageWidth, PageHeight).
        // This solves everything.

        // Wait, `field.coordinates` type is `{ x: number, y: number, ... }`.
        // I can treat them as percentages if I document it, OR add `type: 'percent'` flag.
        // Or just keep simple numbers but interpret them as %? No, they are used as `left: x` (pixels) in CSS.

        // I will MODIFY PDFMapper to save `xPercent`, `yPercent` alongside `x`, `y`?
        // Ideally, `coordinates` should store the "logic" position.
        // If I change `coordinates` to be `%`, the CSS needs `left: ${x * 100}%`.

        // Let's do that! It's the "Right Way".
        // I'll update PDFMapper to calculate and store percentages.
        // CSS will use percentage.
        // PDF Generator will use percentage * naturalSize.
    }

    // Placeholder implementation until I fix the Mapper to use %
    // For now returning empty array to pass type check
    return pdfDoc.save();
}
