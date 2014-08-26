// ==UserScript==
// @name       ThoughtWorks GO - Admin view enchance
// @namespace  http://go.*/
// @version    0.1
// @description  Script used to order groups inside GO ThoughtWorks. Use patternConfig to colour things, and key must always be uppercase
// @match      */go/pipelines*
// @match      */go/home*
// @exclude    */go/pipelines/value_stream_map/*
// @copyright  2014+, Marius Ciotlos
// ==/UserScript==

// Empty this object if you want to have all pipelines visible in the Personalise filter
var groupColourConfig = {
    "dev": "#EFE"
};

// Set there the colour you want as background for the pipelines matching your key
var pipelineColourConfig = {
    "app": "#DEFFBD",
};

// sort function
function sortFunction(a, b) {
      return a.id == b.id
              ? 0
              : (a.id > b.id ? 1 : -1);
}

/*
 * Function adds background colour to an item based on key and returns true if it matched the item to the key
 */
function colourItem(colourConfig, item) {
    for (var key in colourConfig) {
        if (item.id.toUpperCase().indexOf(key.toUpperCase()) > -1) {
            item.style.background = colourConfig[key];        
            return true        
        }
    }  
    return false;
}

function injectCount(groupParent, labelItem, classFilter) {
    var childrenCount = groupParent.getElementsByClassName(classFilter).length;
        if (labelItem.innerHTML.indexOf("[") < 0) { // make sure we can call this as many times as required and will not generate extra markup
            labelItem.innerHTML+="<span style='color: #BBB; position: relative; top: -5px; left: 6px;'>[" + childrenCount + "]</span>"
        }        
    return childrenCount;
}

/*
 * Function used to sort the filters on the Pipeline page. 
 * Sorts pipeline groups and pipelines
 * Also shows pipelines for the tagged groups or for all groups if no tags defined
 * Function also uses groupColourConfig to colour different entities accordingly 
 */
function updatePersonalise() {
    var pipelinegroups = document.getElementById("pipelines_selector_pipelines");
    var itemsArr = [],
        pipelineArr = [],
        colouredGroup,
        childrenCount;
    
    for (i = 0; i < pipelinegroups.children.length; i++) {
        childrenCount = injectCount(pipelinegroups.children[i], pipelinegroups.children[i].children[1], "selector_pipeline");
        // Filter out empty groups
        if (childrenCount == 0) {
            pipelinegroups.children[i].style.display = "none";
        }        
        itemsArr.push(pipelinegroups.children[i]);
    }
    // sort pipeline group
    itemsArr.sort(sortFunction);
    for (i = 0; i < itemsArr.length; ++i) {
        // reset pipeline sorting array
        pipelineArr = [];           
        // Inject colour for group based on configuration
        colouredGroup = colourItem(groupColourConfig, itemsArr[i]);         
        // Sort children        
        for (var j in itemsArr[i].children) {
            // Check if current key > 1 (skip checkbox and label)
            if (j > 1) {
                // Check if we need to add colour to a pipeline as wel
                colourItem(pipelineColourConfig, itemsArr[i].children[j]);
                // expand this only if part of coloured group of no coloured groups
                if (colouredGroup == true || Object.keys(groupColourConfig).length == 0) {
                    itemsArr[i].children[j].style.display = "block";
                }
                // put current pipeline div inside a sortable array
                pipelineArr.push(itemsArr[i].children[j]);
            }
        }
        // remove pipelines in current group
        for (var j = 2; j < itemsArr[i].children; j++) {
            itemsArr[i].removeChild(itemsArr[i].children[j]);                        
        }
        // sort pipelines 
        pipelineArr.sort(sortFunction);
                
        // reappend sorted pipelines
      for (var j = 0; j < pipelineArr.length; j++) {
          itemsArr[i].appendChild(pipelineArr[j]);
      }
      pipelinegroups.appendChild(itemsArr[i]);
    }
}

/*
 * Function used for ordering the Pipeline groups on the dashboard. It is used for the button added to the interface
 * At the moment ordering is not automatically because of missing AJAX even when list is retrieved again from server after a filter change * 
 */
function updateDashboard() {
    var pipelinegroups = document.getElementById("pipeline_groups_container");
    var itemsArr = [],
        pipelineArr = [];
    for (i = 0; i < pipelinegroups.children.length; i++) {
        itemsArr.push(pipelinegroups.children[i]);
    }
    // sort groups
    itemsArr.sort(sortFunction);
    
    // reattach groups
    for (i = 0; i < itemsArr.length; ++i) {
        pipelineArr = [];
        var count = 0;
        // extract pipelines
        pipelineParent = itemsArr[i].children[0].children[0].children[0].children[0];
        injectCount(pipelineParent, pipelineParent.children[0], "pipeline");
        for (var j = 0; j < pipelineParent.children.length; j++) {
            count++;
            if (pipelineParent.children[j].className == "pipeline") {  
                colourItem(pipelineColourConfig, pipelineParent.children[j]);
                pipelineArr.push(pipelineParent.children[j]);
            }       
        }
        
        // delete current deviders (pieplines will get reordered anyway via reference
        for (var j = 0; j < count; j++) {
            if (pipelineParent.children[j]) {
                if ( pipelineParent.children[j].className == "divider") {
                    pipelineParent.removeChild(pipelineParent.children[j]);
                }
            }
        }
        // sort pipelines
        pipelineArr.sort(sortFunction);
        // reattach pipelines with deviders in right place
        for (var j = 0; j < pipelineArr.length; j++) {
            pipelineParent.appendChild(pipelineArr[j]);
            var divider=document.createElement("div");
            divider.className = "divider";
            pipelineParent.appendChild(divider);
        }   
        pipelinegroups.appendChild(itemsArr[i]);        
    }
    window.scrollTo(0, 2); // force a redraw. There seems to be a bug when rearranging elements. 
}
// Add total pipeline group count to "All" button inside the Personalise filter
document.getElementById("select_all_pipelines").innerHTML = document.getElementById("select_all_pipelines").innerHTML + " (" + document.getElementById("pipelines_selector_pipelines").children.length + ")"
// Attach the ordering of filtered groups to the click event on the show pipelines. Its is attached on click because list is rebuilt after click
document.getElementById("show_pipelines_selector").addEventListener("click", updatePersonalise);
// Update dashbaord interface on page load
updateDashboard();

// Create a new button for ordering groups
var input=document.createElement("button");
    input.type="button"; // Type of button is "button" so it can reuse styles from GO
    input.value="Order groups";
    input.onclick = updateDashboard;
    input.className = "submit button" // Button reuses button classes from GO
    input.setAttribute("style", "font-size:18px;position:absolute;right:410px;z-index:9999");
var span=document.createElement("span"); 
    span.innerHTML="Order groups";
    input.appendChild(span);
// end of order groups button
// Attach the new button to the DOM 
document.getElementsByClassName("pipelines_selector")[0].appendChild(input);