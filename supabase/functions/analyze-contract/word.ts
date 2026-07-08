import {
  Document,
  Packer,
  Paragraph,
  HeadingLevel,
  AlignmentType,
  TextRun,
} from "npm:docx";

export async function createWordReport(
  title: string,
  body: string,
): Promise<Uint8Array> {

  const doc = new Document({
    sections: [
      {
        children: [

          new Paragraph({
            heading: HeadingLevel.TITLE,
            alignment: AlignmentType.CENTER,
            children: [
              new TextRun({
                text: title,
                bold: true,
                size: 36,
              }),
            ],
          }),

          new Paragraph({
            children: [
              new TextRun({
                text: body,
                size: 26,
              }),
            ],
          }),

        ],
      },
    ],
  });

  return await Packer.toUint8Array(doc);
}
