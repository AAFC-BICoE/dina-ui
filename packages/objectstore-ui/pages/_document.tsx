import Document, { Head, Html, Main, NextScript } from "next/document";
import React from "react";
import { renderToStaticMarkup } from "react-dom/server";

/* tslint:disable:max-classes-per-file */
class WetFooter extends React.Component {
  public render() {
    let dangerousInnerHTML;

    if (this.props && this.props.children) {
      if (typeof this.props.children !== "string") {
        dangerousInnerHTML = "";
      } else {
        dangerousInnerHTML = this.props.children;
      }
    }

    return <footer dangerouslySetInnerHTML={{ __html: dangerousInnerHTML }} />;
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
  public static async getInitialProps(ctx) {
    const initialProps = await Document.getInitialProps(ctx);
    return { ...initialProps };
  }

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
        </body>
        <WetFooter>
          {`
            <script src="https://ajax.googleapis.com/ajax/libs/jquery/2.2.4/jquery.js"></script>
            <script src="https://wet-boew.github.io/themes-dist/GCWeb/wet-boew/js/wet-boew.min.js"></script>
              
            <script src="https://wet-boew.github.io/themes-dist/GCWeb/js/theme.min.js"></script>
            <script src="https://www.canada.ca/etc/designs/canada/cdts/gcweb/rn/cdts/compiled/soyutils.js"></script>
		        <script src="https://www.canada.ca/etc/designs/canada/cdts/gcweb/rn/cdts/compiled/wet-en.js"></script>

            <noscript>
              <!-- Write closure fall-back static file -->
              <!-- /ROOT/etc/designs/canada/cdts/gcweb/v4_0_28/cdts/static/refTop.html -->
              <!--#include virtual="/app/cls/WET/gcweb/v4_0_28/cdts/static/refTop.html" -->
            </noscript>

            <script>
                var defTop = document.getElementById("def-top");                
                defTop.outerHTML = wet.builder.appTop({ 
                  "siteMenu": true,  
                  "search": false,                                    
                  "lngLinks":
                      [{
                        "lang": "fr",
                        "href": "#fr",
                        "text": "Français" }],
                  "appName":
                    [{
                        "text": "AAFC BICOE - DINA Object Store",
                        "href": "#" }] 
                });

                document.write(wet.builder.refTop({
                    "webAnalytics" : [{
                      "environment" : "staging",
                      "version" : 1
                    }],
                    "isApplication":true
                  }));                  

                var defPreFooter = document.getElementById("def-preFooter");
                defPreFooter.outerHTML = wet.builder.preFooter({
                  "showShare": false,
                  "showFeedback": false
                });    
                
                var defFooter = document.getElementById("def-footer");
                defFooter.outerHTML = wet.builder.appFooter({
				          "contactLink": "./contact-en.html"
                });  

                function getLocaleCookie(key){
                    var allcookies = document.cookie;
                    var cookieArr=allcookies.split(";");
                    var hasLocale = false;
                    var isEnLocale = false;
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

               $(document).on("click", ".btn.btn-link",function () {                  
                  let btnText = $( ".btn.btn-link" ).text();
                  if(btnText.indexOf("English")>=0){
                    document.cookie = 'locale=en; path=/';                    
                  }
                  else
                    document.cookie = 'locale=fr; path=/';
                  location.reload(false); //loads from browser's cache 
                });                                

                var lan = document.getElementById("wb-lng");
                var isEnLocale = getLocaleCookie("en");
                lan.innerHTML = '<div class="float-right"><button class="btn btn-link" ></button></div>';                
                $("#wb-lng button.btn.btn-link").html(isEnLocale? "Français":"English" )
            </script>                                                       
        `}
        </WetFooter>
      </Html>
    );
  }
}
export default DinaDocument;
