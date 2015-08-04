;
(function () {
    chrome.runtime.onMessage.addListener(function (req, sender, sendRes) {
        switch (req.action) {
            case 'create-modal':
                createModal(req.tabsArr);
                //chrome.runtime.sendMessage({ action: 'create-modal', tabsArr: req.tabsArr });
                break;
            default:
                sendRes('nope');
                break;
        }
    });

    function createModal(tabsArr) {
        //TODO check if alr clicked/ modal already exists
        var wrapperDiv =
            "<div style='position: fixed; left: 0px; top: 0px; background-color: rgb(255, 255, 255); opacity: 0.5; z-index: 2000; height: 1083px; width: 100%;'>" +
            "<iframe style='width: 100%; height: 100%;'></iframe>" +
            "</div>";
        var dialogDiv = $('<div> </div>');
        dialogDiv.css({
            "position": "fixed",
            "width": "350px",
            "border": "1px solid rgb(51, 102, 153)",
            "padding": "10px",
            "background-color": "rgb(255, 255, 255)",
            "z-index": "2001",
            "overflow": "auto",
            "text-align": "center",
            "top": "20%",
            "left": "43%"
        });
        var checkbox = $('<input>', {
            type:"checkbox",
            "checked":"checked"
        });
        tabsArr.forEach(function (tab) {
            dialogDiv.append("<p>" + tab.title + "</p>");
        });

        dialogDiv.append("<button> Save </button>");

        $(document.body).append(wrapperDiv);
        $(document.body).append(dialogDiv);

    }

})();
