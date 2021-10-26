import NextHead from "next/head";
import React from "react";

const defaultDescription = "";
const defaultOGURL = "";
const defaultOGImage = "";
const defaultTitle = "";
const defaultLang = "";
const defaultCreator = "";
const defaultSubject = "";

interface HeadProps {
  title?: string;
  description?: string;
  url?: string;
  ogImage?: string;
  lang?: string;
  creator?: string;
  subject?: string;
}

export function Head(props: HeadProps) {
  return (
    <NextHead>
      <meta charSet="UTF-8" />
      <title>{props.title + " - DINA"}</title>

      <meta name="dcterms:title" content={props.title || defaultTitle} />
      <meta name="dcterms:creator" content={props.creator || defaultCreator} />
      <meta
        name="dcterms:language"
        title="ISO639-2"
        content={props.lang || defaultLang}
      />
      <meta
        name="dcterms:subject"
        title="gccore"
        content={props.subject || defaultSubject}
      />
      <meta name="dcterms:issued" title="W3CDTF" content="2021-11-01" />
      <meta name="dcterms:modified" title="W3CDTF" content="2021-11-01" />

      <meta
        name="dcterms:description"
        content={props.description || defaultDescription}
      />
      <meta name="viewport" content="width=device-width, initial-scale=1" />
      <meta property="og:url" content={props.url || defaultOGURL} />
      <meta property="og:title" content={props.title || ""} />
      <meta
        property="og:description"
        content={props.description || defaultDescription}
      />
      <meta name="twitter:site" content={props.url || defaultOGURL} />
      <meta name="twitter:card" content="summary_large_image" />
      <meta name="twitter:image" content={props.ogImage || defaultOGImage} />
      <meta property="og:image" content={props.ogImage || defaultOGImage} />
      <meta property="og:image:width" content="1200" />
      <meta property="og:image:height" content="630" />
      <link rel="icon" sizes="192x192" href="/static/touch-icon.png" />
      <link rel="apple-touch-icon" href="/static/touch-icon.png" />
      <link rel="mask-icon" href="/static/favicon-mask.svg" color="#49B882" />
      <link rel="icon" href="/static/favicon.ico" />
    </NextHead>
  );
}
