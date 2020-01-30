import Document, { Head, Html, Main, NextScript } from "next/document";
import React from "react";

/* tslint:disable:max-classes-per-file */
class WetFoot extends React.Component {
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

class WetHead extends React.Component {
  public render() {
    let dangerousInnerHTML;

    if (this.props && this.props.children) {
      if (typeof this.props.children !== "string") {
        dangerousInnerHTML = "";
      } else {
        dangerousInnerHTML = this.props.children;
      }
    }

    return <head dangerouslySetInnerHTML={{ __html: dangerousInnerHTML }} />;
  }
}

class WetHtml extends React.Component {
  public render() {
    let dangerousInnerHTML;

    if (this.props && this.props.children) {
      if (typeof this.props.children !== "string") {
        dangerousInnerHTML = "";
      } else {
        dangerousInnerHTML = this.props.children;
      }
    }

    return <html dangerouslySetInnerHTML={{ __html: dangerousInnerHTML }} />;
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
        <WetHtml>
          {`
            <!--[if lt IE 9]><html class="no-js lt-ie9" lang="en" dir="ltr"><![endif]--><!--[if gt IE 8]><!-->
              <html class="no-js" lang="en" dir="ltr">
            <!--<![endif]-->                
         `}
        </WetHtml>
        <WetHead>
          {`
            <!--[if gte IE 9 | !IE ]><!-->
              <link href="https://wet-boew.github.io/themes-dist/GCWeb/assets/favicon.ico" rel="icon" type="image/x-icon">
              <link rel="stylesheet" href="https://use.fontawesome.com/releases/v5.8.1/css/all.css" integrity="sha384-50oBUHEmvpQ+1lW4y57PTFmhCaXp0ML5d60M1M7uH2+nqUivzIebhndOJK28anvf" crossorigin="anonymous">
              <link rel="stylesheet" href="https://wet-boew.github.io/themes-dist/GCWeb/css/theme.min.css">
            <!--<![endif]-->
            <!--[if lt IE 9]>
              <link href="https://wet-boew.github.io/themes-dist/GCWeb/assets/favicon.ico" rel="shortcut icon" />                              
              <link rel="stylesheet" href="https://wet-boew.github.io/themes-dist/GCWeb/css/ie8-theme.min.css" />
              <script src="https://ajax.googleapis.com/ajax/libs/jquery/1.12.4/jquery.js"></script>
              <script src="https://wet-boew.github.io/themes-dist/wet-boew/js/ie8-wet-boew.min.js"></script>
            <![endif]-->
            <!--[if lte IE 9]>		
            <![endif]--></link>
          `}
        </WetHead>
        <Head />
        <body>
          <div id="def-top" />
          <div className="container">
            <div className="row">
              <Main />
              <nav
                className="wb-sec"
                typeof="SiteNavigationElement"
                id="wb-sec1"
                role="navigation"
              />
              <div id="def-preFooter" />
            </div>
          </div>
          <div id="def-footer" />
          <NextScript />
        </body>
        <WetFoot>
          {`
            <!--[if gte IE 9 | !IE ]><!-->
              <script src="https://ajax.googleapis.com/ajax/libs/jquery/2.2.4/jquery.js"></script>
               <script src="https://wet-boew.github.io/themes-dist/GCWeb/wet-boew/js/wet-boew.min.js"></script>
            <!--<![endif]-->
            <!--[if lt IE 9]>
	            <script src="https://wet-boew.github.io/themes-dist/GCWeb/wet-boew/js/ie8-wet-boew2.min.js"></script>
            <![endif]-->
              
            <script src="https://wet-boew.github.io/themes-dist/GCWeb/js/theme.min.js"></script>
            <script src="https://www.canada.ca/etc/designs/canada/cdts/gcweb/v4_0_32/cdts/compiled/soyutils.js"></script>
            <script src="https://www.canada.ca/etc/designs/canada/cdts/gcweb/v4_0_32/cdts/compiled/wet-en.js"></script>

            <noscript>
              <!-- Write closure fall-back static file -->
              <!-- /ROOT/etc/designs/canada/cdts/gcweb/v4_0_28/cdts/static/refTop.html -->
              <!--#include virtual="/app/cls/WET/gcweb/v4_0_28/cdts/static/refTop.html" -->
            </noscript>

            <script>
                var defTop = document.getElementById("def-top");                
                defTop.outerHTML = wet.builder.appTop({ 
                  "breadcrumbs": [{
                    "title": "Home",
                    "href": "http://localhost:8000/media-uploadView/uploadFile"
                  },{
                    "title": "Detail View",
                    "acronym": "Object store metadata upladed file detail view",
                    "href": "http://localhost:8000/media-uploadView/detailView?id=undefined#"
                  }],                              
                  "menuLinks": [{
                    "href": "http://localhost:8000/media-uploadView/uploadFile",
                    "text": "Upload Files"
                    },{
                    "href": "http://localhost:8000/media-uploadView/detailEdit?id=undefined#",
                    "text": "Bulk Edit"
                  }],                  
                  "lngLinks":
                      [{
                        "lang": "fr",
                        "href": "application-fr.html",
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
                  "dateModified": "2020-01-20"
                });    
                
                var defFooter = document.getElementById("def-footer");
                defFooter.outerHTML = wet.builder.appFooter({
				          "contactLink": "./contact-en.html"
                });
                
                var secondarymenu = document.getElementById("wb-sec");
                  secondarymenu.innerHTML = wet.builder.secmenu({
                    "sections": [{
                      "sectionName": "[Topic - Local navigation]",
                      "menuLinks": [{
                        "href": "#",
                        "text": "Link 1",
                        "subLinks": [{
                          "subhref": "#11a",
                          "subtext": "Link 1.1 a)"
                        }, {
                          "subhref": "#11b",
                          "subtext": "Link 1.1 b)"
                        }, {
                          "subhref": "#11c",
                          "subtext": "Opens in a new window",
                          "newWindow": true
                        }, {
                          "subhref": "#11d",
                          "subtext": "Link 1.1 d)"
                        }]
                      }, {
                        "href": "#",
                        "text": "Link 2"
                      }, {
                        "href": "#",
                        "text": "Opens in a new window",
                        "newWindow": true
                      }, {
                        "href": "#",
                        "text": "Link 4"
                      }]
                    },{
                      "sectionName": "Opens in a new window",
                      "sectionLink": "#",
                      "newWindow": true,
                      "menuLinks": [{
                        "href": "#",
                        "text": "Link 1"
                      }, {
                        "href": "#",
                        "text": "Link 2"
                      }, {
                        "href": "#",
                        "text": "Link 3"
                      }, {
                        "href": "#",
                        "text": "Link 4"
                      }]
                    },{
                      // Rinse and repeat
                      "sectionName": "Section name 3",
                      "menuLinks": [{
                        "href": "#",
                        "text": "Link 1"
                      }, {
                        "href": "#",
                        "text": "Link 2"
                      }, {
                        "href": "#",
                        "text": "Link 3"
                      }, {
                        "href": "#",
                        "text": "Link 4"
                      }]
                    },{
                      // Rinse and repeat
                      "sectionName": "Section name ... 27",
                      "menuLinks": [{
                        "href": "#",
                        "text": "Link 1"
                      }, {
                        "href": "#",
                        "text": "Link 2"
                      }, {
                        "href": "#",
                        "text": "Link 3"
                      }, {
                        "href": "#",
                        "text": "Link 4"
                      }]
                    }]
                  });                
            </script>                 
                                      
        `}
        </WetFoot>
      </Html>
    );
  }
}
export default DinaDocument;
