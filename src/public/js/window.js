
const { ipcRenderer, remote } = require('electron');

const coursesActions = require("../../shared/actions/courses");
const ipfsActions = require("../../shared/actions/ipfs");

const configureStore = require('../../shared/store/configureStore');

// get the global.state from the main process
const initialState = remote.getGlobal('state');

// create store
const store = configureStore(initialState, 'renderer');

var currentPage = 1;
 
var totalPages=0;
// these ping main process
var __actions = {
    // should the main.store track the windows aswell?
    openCourseLink: function(url){
        ipcRenderer.send('createAndShowChildWindow', url);
    },
    showSettings: function(){
        ipcRenderer.send('openSettings');
    },
    start: function(){
        store.dispatch(ipfsActions.start());
    },
    stop: function(){
       store.dispatch(ipfsActions.stop());
    },
    addPin: function(id, hash){
        store.dispatch(ipfsActions.addPin(id, hash));
    },
    removePin: function(id, hash){
        store.dispatch(ipfsActions.removePin(id, hash));
    },
};

var __ui = {
    setIPFSStatusButton: function (isOnline){
        if(isOnline){
          $('#ipfs-icon-ref').removeClass('btn-outline-danger').addClass('btn-success');
          $('#img-ipfs-icon').prop("alt",'IPFS Online');
        }
        else{
            $('#ipfs-icon-ref').removeClass('btn-success').addClass('btn-outline-danger');
        }
    }, 
    createHomePageCard: function(image, title, indexURL, courseDirectoryHash, courseId, action){
        __ui.loadingComplete(true);
        action = action || "...";
   
        var rendered = Mustache.render(
            $("#course-card-template").html(),
            { image, title, indexURL, courseDirectoryHash, courseId, action }
        );
        $('#course-cards').append(rendered);
        
    },
    clearCard: function(){
          $('#course-cards').empty();
    },
    showPeerCount: function(peerCount){
         $('#swarm-count').html(peerCount);
    },
    setPinStatus: function(id, isPinned){
    
        var 
            action = (isPinned ? "unpin" : "pin"),
            $courseCard = $(`#${id}`),
            $actionLink = $courseCard.find("a.pin-course-link");
        
        $actionLink.data("action", action);
        $actionLink.text(action);
        
        $courseCard.find(".pin-status").text( ( isPinned ? "Pinned" : "Un-Pinned" ) );
        $actionLink.removeClass( ( isPinned ? "unpinImage" : "pinImage") );
        $actionLink.addClass( ( isPinned ? "pinImage" : "unpinImage") );
    },
    loadingComplete: function(bool){
    
        if(bool === false){
            $(".loader").show();
            $("#search-btn").attr("disabled",true);

        }
        else{
            $(".loader").hide();
            $("#search-btn").attr("disabled",false);
        }
    },
    nextResult: function(){
         __ui.clearCard();
        let data=store.getState().courses.pageMap;
        let i=0;
        let pSize = store.getState().courses.pageSize;
        let startPointer = pSize*currentPage+1;
        currentPage=currentPage+1;

        data.forEach(function(val){
       
         var content=data.get(startPointer);
   
           if(i<=pSize && content !=null){
                    
                store.dispatch(coursesActions.dispatchCourseRoot(content));
                i++;
                startPointer++;
            }
            
        })
    },
    /* prevResult: function(){
        __ui.clearCard();
        let data=store.getState().courses.pageMap;
        let i=0;
        let pSize = store.getState().courses.pageSize;
        currentPage=currentPage-1;
        let startPointer=1;
      
        if(currentPage!=1){
            startPointer = pSize*(currentPage-1)+1;
        }
        
       data.forEach(function(val){
         
           if(i<pSize){
  
                store.dispatch(coursesActions.dispatchCourseRoot(data.get(startPointer)));
                i++;
                startPointer++;
            }
            
        })
    },*/
    search: function(searchParam, callback){
  
        currentPage=1;
    
        __ui.clearCard();
        
        store.dispatch({
            type:"clearState",
            payload:store.getState()
        });

        store.dispatch(coursesActions.getSearchData(searchParam)); 
      
        setTimeout(function(){
         
            let data= store.getState().courses.items;
            let i=0;
            let p=store.getState().courses.pageSize;
           
            Object.keys(data).forEach(function(val){

                if(i<p){
                    store.dispatch(coursesActions.dispatchCourseRoot(val));
                    i++;
                }
            });
             callback();
        },3000);
       
    }

};

// this function updates page based on state
// this can be broken into several functions triggered by applyState
var applyState = function applyState(state){
    __ui.setIPFSStatusButton(state.ipfs.isOnline);
    __ui.showPeerCount(state.ipfs.peers);

   //apply courses once all items are loaded
    if(Object.keys(state.courses.items).length === store.getState().courses.resultCount){

        applyCourses(state.courses.items);

    }
   
};


var callback = function(value){

       store.dispatch(
        {
            type:'setSearch', 
            payload: value
        });
       
    
};

var setIsDisplayed= function (id,value){

    store.dispatch({ 

        "type" : "setIsDisplayed", 
        "payload" : {
            "id": id, 
            "value": value
        }
    });

};

var getTotalPages = function(cLen,pageSize){

    let totalPages =0;
    
    if(cLen%pageSize === 0){
        totalPages=cLen/pageSize;
    }
    else{
        totalPages=cLen/pageSize+1;
    }

 return totalPages;

}

var applyCourses = function(items){
    courseKeys = Object.keys(items);

    let pageSize=store.getState().courses.pageSize;
    let cLen = store.getState().courses.resultCount;
    let displayedCourses = [];
    let itemProcessed=0;
    var displayCount =0;
    
    totalPages = getTotalPages(cLen,pageSize);

    if(Math.trunc(totalPages)===currentPage){
         $('#nxt-btn').hide();
    }
    else{
         $('#nxt-btn').show();
    }

    courseKeys.forEach(function(key){
        
        let course = items[key];

        let $courseCard = $(`#${course.id}`);
        let meta = course.META;

        let isReady = meta.urls.image && meta.urls.index && meta.hashes.courseDirectoryHash && course.course_title;
        __ui.setPinStatus(course.id, course.META.isPinned);
       
        if(isReady && !$courseCard.length){

        itemProcessed = itemProcessed+1;    
          
           if(!course.isDisplayed && !$courseCard.length){
                setIsDisplayed(course.id,true);

                displayCount++;
                displayedCourses.push(course.id);

               __ui.createHomePageCard(
                    meta.urls.image, course.course_title, meta.urls.index, 
                    meta.hashes.courseDirectoryHash, course.id
                );
           
            }

        }
      
       if(itemProcessed === cLen){
            callback(false);
       }

    });

};

function onPageLoad(){
        
    var searchObj = {
        "search_type":'',
        "search_term":''
      }
    __ui.search(searchObj,function(){
        $('#search-count').text("Results Returned: " + store.getState().courses.resultCount);
});

}

$(document).ready(function() {

     __ui.loadingComplete(false);
     onPageLoad();

    $('#course-cards').on("click", '.pin-course-link', function(event){
        event.preventDefault();
        var { action, id, hash } = $(this).data();
        __actions[(action === "unpin" ? "removePin" : "addPin")](id, hash);
    });

    $("#ipfs-icon-ref").on("click", function(event){
        event.preventDefault();
        __actions.showSettings();
    });


    $("#search-btn").on("click",function(event){
        event.preventDefault();
       

        if($("#search-input").val().trim() === ''){
            alert("Please enter a value");
            return;
        }

        __ui.loadingComplete(false);
       
        var searchObj = {
            "search_type":$("#search-types option:selected").val(),
            "search_term":$("#search-input").val()
          }

        __ui.search(searchObj,function(){
            $('#search-count').text("Results Returned:" + store.getState().courses.resultCount);
        });

    });
 
    $('#course-cards').on("click", ".card a.course-link", function(event){
        event.preventDefault();
        var url = $(this).data("url");
        __actions.openCourseLink(url);
    });

    $('#nxt-btn').on("click",function(event){
        __ui.loadingComplete(false);
        event.preventDefault();
        __ui.nextResult();

    })
  
    applyState(store.getState());
 
    store.subscribe(function(){
        // executed when something could have changed the state
          applyState(store.getState());
       
    });
});
