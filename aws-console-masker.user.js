// ==UserScript==
// @name         AWSConsoleMasker
// @namespace    http://aws.amazon.com/
// @version      0.12
// @description  Mask PII data like AWS Account #s and IPs in the AWS Console.
// @author       labatf@amazon.com
// @match        https://*.console.aws.amazon.com/*
// @grant        none
// @run-at       document-end
// ==/UserScript==

(function () {
    'use strict';

    // Replace logged in principal, account name, and federated user:
   // document.querySelector("#nav-usernameMenu > div.nav-elt-label").innerHTML = "AWS Account";
    //document.querySelector("#awsc-login-display-name-account").innerHTML = "My AWS Account";
   // document.querySelector("#awsc-login-display-name-user").innerHTML = "AnyCompany/jdoe";

    // Array of terms to replace, you can use Regular expressions.

    var replaceArry = [
        [/([a-zA-Z0-9_\-\.\+]+)@([a-zA-Z0-9_\-\.]+)\.([a-zA-Z]{2,5})/, 'johndoe@example.com'], // email address
        [/\d{12}/, '123456789012'], // 12 digit AWS Account #s
        [/\#\d{12}/, '#123456789012'], // 12 digit AWS Account #s
        [/([a-z0-9]{4})-([a-z0-9]{4})-([a-z0-9]{4})/, '1234-5678-9012'], // 12 digit AWS Account #s
        [/\b\d{1,3}\.\d{1,3}\.\d{1,3}\.\d{1,3}\b/, '10.24.34.0'], // IP Addresses
        [/\b\d{1,3}\-\d{1,3}\-\d{1,3}\-\d{1,3}\b/, '10-24-34-0'], // EC2 DNS CNAME IPs
        [/(^|[^A-Z0-9])[A-Z0-9]{20}(?![A-Z0-9])/, 'AIDACKCEVSQ6C2EXAMPLE'], // IAM Access Key ID
        [/([a-z0-9]{4})-([a-z0-9]{4})-([a-z0-9]{12})/, '1234-5678-9012-abcdefabcdef'],
         [/(Isengard)|(ISENGARD)|(isengard)|(Nacunda)|(GatedGarden)|(gatedgarden)/, ''],
        // etc.
    ];
    var numTerms = replaceArry.length;
    //-- 5 times/second; Plenty fast.
    var transTimer = setInterval(translateTermsOnPage, 500);

    function translateTermsOnPage() {
        /*--- Replace text on the page without busting links or javascript
        functionality.
    */

        var txtWalker = document.createTreeWalker(
            document.body,
            NodeFilter.SHOW_TEXT, {
                acceptNode: function (node) {
                    //-- Skip whitespace-only nodes
                    if (node.nodeValue.trim()) {
                        if (node.tmWasProcessed) {
                           return NodeFilter.FILTER_SKIP;
                        } else{
                            return NodeFilter.FILTER_ACCEPT;
                        }
                   }
                    return NodeFilter.FILTER_SKIP;
                }
            },
            false
        );
        var txtNode = null;
        while (txtNode = txtWalker.nextNode()) {
           // console.log(txtNode,txtNode.nodeValue);
            txtNode.nodeValue = replaceAllTerms(txtNode.nodeValue);

            txtNode.tmWasProcessed = true;
        }
        //
        //--- Now replace user-visible attributes.
        //

        var placeholderNodes = document.querySelectorAll("[placeholder]");
        replaceManyAttributeTexts(placeholderNodes, "placeholder");

        var titleNodes = document.querySelectorAll("[title]");
        replaceManyAttributeTexts(titleNodes, "title");

        if (!window.frames[0]) {
         return 0;
        }
        txtWalker = null;
        txtWalker = window.frames[0].document.createTreeWalker(
            window.frames[0].document.body,
            NodeFilter.SHOW_TEXT, {
                acceptNode: function (node) {
                    //-- Skip whitespace-only nodes
                    if (node.nodeValue.trim()) {
                        if (node.tmWasProcessed) {
                           return NodeFilter.FILTER_SKIP;
                        } else{
                            return NodeFilter.FILTER_ACCEPT;
                        }
                   }
                    return NodeFilter.FILTER_SKIP;
                }
            },
            false
        );
        txtNode = null;
        while (txtNode = txtWalker.nextNode()) {
          //  console.log(txtNode,txtNode.nodeValue);
            txtNode.nodeValue = replaceAllTerms(txtNode.nodeValue);

            txtNode.tmWasProcessed = true;
        }
        
    }

    function replaceAllTerms(oldTxt) {
        for (var J = 0; J < numTerms; J++) {

            oldTxt = oldTxt.replace(replaceArry[J][0], replaceArry[J][1]);

        }
        return oldTxt;
    }

    function replaceManyAttributeTexts(nodeList, attributeName) {
        for (var J = nodeList.length - 1; J >= 0; --J) {
            var node = nodeList[J];
            var oldText = node.getAttribute(attributeName);

            if (oldText) {
                oldText = replaceAllTerms(oldText);
                node.setAttribute(attributeName, oldText);
            } else {
                throw "attributeName does not match nodeList in replaceManyAttributeTexts";
            }
        }
    }

})();
