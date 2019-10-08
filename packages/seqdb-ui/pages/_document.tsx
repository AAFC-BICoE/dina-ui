import Document, { Head, Main, NextScript } from "next/document";

export default class SeqdbDocument extends Document {
  public render() {
    return (
      <html lang="en">
        <Head />
        <body>
          <Main />
          <NextScript />
        </body>
      </html>
    );
  }
}
