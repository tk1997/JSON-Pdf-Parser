const { json } = require("express");
const express = require("express");
const { jsPDF } = require("jspdf");

const app = express();

// serve static files
app.use("/pdf", express.static("public"));

// allows cross origin access
app.use((request, response, next) => {
    response.header("Access-Control-Allow-Origin", "*");
    next();
});

// access point
app.get("/", (req, res) => {
    console.log("GET: / received @ " + (new Date(Date.now())).toISOString());

    let dataReceived = req.query.data
    let jsonReceived = JSON.parse("{ }");

    // console.log("data received = " + dataReceived);

    if (!dataReceived || dataReceived == undefined) {
        res.status(400).send(JSON.stringify('{ "result" : "unsuccessful", "reason" : "no data supplied" }'));
        return;
    }
    else {
        try {
            jsonReceived = JSON.parse(dataReceived);
        }
        catch (exception) {
            res.status(400).send(JSON.stringify('{ "result" : "unsuccessful", "reason" : "supplied data is not a valid JSON" }'));
            return;
        }

        try {
            generatePDF(jsonReceived);
        }
        catch (exception) {
            res.status(400).send(JSON.stringify('{ "result" : "unsuccessful", "reason" : "unable to parse supplied data" }'));
            return;
        }
        res.send(JSON.parse('{ "result" : "successful", "pdfUrl" : "http://127.0.0.1:3000/pdf/menu.pdf" }'));
        return;
    }
});

// listen on port 3000
app.listen(3000,
    () => {
        console.log("Server started and listening on port 3000...");
    }
);

function generatePDF(offerings) {

    // default size is A4, default orientation is portrait
    var pdf = new jsPDF();
    // if you want to use US letter as the page size, for example:
    // var pdf = new jsPDF({ format: "letter" });

    // get document properties

    var pageWidth = pdf.internal.pageSize.width;
    var pageHeight = pdf.internal.pageSize.height;

    // console.log("page width = " + pageWidth);
    // console.log("page height = " + pageHeight);

    // set document properties

    pdf.setProperties({
        title: 'Flight Deck Cafe Menu',
        subject: 'menu',
        author: 'Flight Deck Cafe',
        keywords: 'menu, order, food, offerings',
        creator: 'Flight Deck Cafe',
    });

    pdf.setFont("helvetica", "bold");

    pdf.setFontSize(36);
    pdf.setTextColor(0, 132, 255);
    pdf.text(pageWidth / 2, 35, "Flight Deck Cafe", "center");

    pdf.setFontSize(25);
    pdf.setTextColor(11, 88, 187);
    pdf.text(pageWidth / 2, 55, "Welcome Aboard!", "center");

    pdf.setFont("helvetica", "normal");

    pdf.setFontSize(10);
    pdf.setTextColor(0, 0, 0);
    pdf.text(pageWidth / 2, 70, "Open 6:00am to 10:00pm 7 days a week!", "center");

    pdf.setFont("helvetica", "bold");

    pdf.setFontSize(22);
    pdf.setTextColor(201, 122, 18);
    pdf.text(pageWidth / 2, 95, "Menu", "center");

    let runningY = 115;
    let itemCount = 0;
    // this is only for the first page
    // will be adjusted for subsequent pages
    let maxItems = 4;

    // generate each menu item

    offerings.items.forEach(item => {

        itemCount ++;

        // start a new page if we have to

        if (itemCount > maxItems) {
            itemCount = 1;  // reset item count
            pdf.addPage();  // add a new page
            maxItems = 6;   // more items on future pages
            runningY = 40;  // back to near top
        }

        pdf.setFont("helvetica", "bold");
        pdf.setFontSize(18);
        pdf.setTextColor(255, 136, 0);
        pdf.text(pageWidth / 2, runningY, item.name, "center");

        runningY += 8;
        pdf.setFontSize(16);
        pdf.text(pageWidth / 2, runningY, "$" + item.price.toFixed(2), "center");

        // has ingredients

        if (item.ingredients.length > 0) {
            runningY += 8;
            pdf.setFont("helvetica", "normal");
            pdf.setFontSize(14);
            pdf.setTextColor(0, 0, 0);

            let listString = "";

            item.ingredients.forEach((ingredient, index) => {
                if (index > 0) {
                    listString += ", ";
                }
                listString += ingredient;
            })

            if (listString.length > 65) {
                
                let cutOff = listString.lastIndexOf(",");

                // if the string is too long
                // cut off at 65th character or last comma, if found

                if (cutOff == -1 || cutOff > 65) {
                    cutOff = 65;
                }

                listString = listString.substr(0, cutOff) + "...";

            }

            pdf.text(pageWidth / 2, runningY, listString, "center");
            runningY += 8;
        }

        let ratingString = "vegetarian: ";
        ratingString += item.isVegetarian ? "yes" : "no";

        if (item.spicinessScale > 0) {
            ratingString += ", spiciness: " + item.spicinessScale + "/3";
        }

        pdf.setTextColor(80, 120, 175);
        pdf.setFontSize(13);
        pdf.text(pageWidth / 2, runningY, ratingString, "center");
        runningY += 16;

    })

    pdf.save("public/menu.pdf");
    console.log("PDF successfully generated ");

    return;
}
