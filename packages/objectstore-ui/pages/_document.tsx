import parse from "html-react-parser";
import Document, { Head, Html, Main, NextScript } from "next/document";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

/* tslint:disable:max-classes-per-file */
class WetFooter extends React.Component {
  public htmlToReact() {
    const html = `
            <script src="https://www.canada.ca/etc/designs/canada/cdts/gcweb/rn/cdts/compiled/soyutils.js"></script>
            <script src="https://www.canada.ca/etc/designs/canada/cdts/gcweb/rn/cdts/compiled/wet-en.js"></script>          
            <script>
                let defTop = document.getElementById("def-top");                
                defTop.outerHTML = wet.builder.appTop({ 
                  "siteMenu": true,  
                  "search": false,                                    
                  "lngLinks":
                      [{
                        "lang": "fr",
                        "text": "Français" }],
                  "appName":
                    [{
                        "text": "AAFC BICOE - DINA Object Store",
                        "href": "/" 
                      }] 
                });
                document.write(wet.builder.refTop({
                    "webAnalytics" : [{
                      "environment" : "staging",
                      "version" : 1
                    }],
                    "isApplication":true
                  }));                  

                let defPreFooter = document.getElementById("def-preFooter");
                defPreFooter.outerHTML = wet.builder.preFooter({
                  "showShare": false,
                  "showFeedback": false
                });    
                let defFooter = document.getElementById("def-footer");
                defFooter.outerHTML = wet.builder.appFooter({
				          "contactLink": "./contact-en.html"
                });  
                let isEnLocale = false;                
                  function getLocaleCookie(key){
                     let allcookies = document.cookie;
                     let cookieArr=allcookies.split(";");
                     let hasLocale = false;
                     let isEnLocale = false;
                     cookieArr.map((cookie)=>{
                       name = cookie.split('=')[0];
                       value = cookie.split('=')[1];
                       if(name.indexOf("locale")>=0){
                         hasLocale=true
                         isEnLocale = (key==value)
                      }
                    })
                    if(!hasLocale)
                      isEnLocale = true;
                    return isEnLocale;
                };

                  document.body.addEventListener('click', (event) => {
                  if (!event.target.matches('.btn.btn-link')) return;
                  let length = document.getElementsByClassName("btn btn-link").length
                  if(length<=0) return;
                  let btnText = document.getElementsByClassName("btn btn-link")[0].innerText;
                  if(btnText.indexOf("English")>=0){
                    document.cookie = 'locale=en; path=/';                    
                  }
                  else
                    document.cookie = 'locale=fr; path=/';
                  location.reload(false); //loads from browser's cache 
                });                                 
                let lan = document.getElementById("wb-lng");
                isEnLocale = getLocaleCookie("en");
                lan.innerHTML = '<div class="float-right"><button class="btn btn-link" ></button></div>';                
                document.querySelector("#wb-lng button.btn.btn-link").innerHTML = isEnLocale? "Français":"English";
            </script>      
          `;
    return parse(html);
  }

  public render() {
    return this.htmlToReact();
  }
}

class WetHeader extends React.Component {
  public render() {
    let headerNode;
    headerNode = document.createElement("header");
    headerNode.innerHTML = renderToStaticMarkup(
      <>
        <link
          href="https://wet-boew.github.io/themes-dist/GCWeb/assets/favicon.ico"
          rel="icon"
          type="image/x-icon"
        />
        <link
          rel="stylesheet"
          href="https://use.fontawesome.com/releases/v5.8.1/css/all.css"
          integrity="sha384-50oBUHEmvpQ+1lW4y57PTFmhCaXp0ML5d60M1M7uH2+nqUivzIebhndOJK28anvf"
          crossOrigin="anonymous"
        />
        <link
          rel="stylesheet"
          href="https://wet-boew.github.io/themes-dist/GCWeb/css/theme.min.css"
        />
      </>
    );
    return headerNode;
  }
}

class WetHtml extends React.Component {
  public render() {
    let htmlNode;
    htmlNode = document.createElement("html");
    htmlNode.innerHTML = renderToStaticMarkup(
      <html className="no-js" lang="en" dir="ltr" />
    );

    return htmlNode;
  }
}
class DinaDocument extends Document {
  public render() {
    return (
      <Html>
        {process.browser && <WetHtml />}
        {process.browser && <WetHeader />}
        <Head />
        <body>
          <div id="def-top" />
          <Main />
          <div id="def-preFooter" />
          <div id="def-footer" />
          <NextScript />
          <WetFooter />
        </body>
      </Html>
    );
  }
}
export default DinaDocument;
