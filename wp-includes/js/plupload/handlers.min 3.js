var uploader,uploader_init,topWin=window.dialogArguments||opener||parent||top;function fileQueued(e){jQuery(".media-blank").remove();var a=jQuery("#media-items").children(),r=post_id||0;1==a.length&&a.removeClass("open").find(".slidetoggle").slideUp(200),jQuery('<div class="media-item">').attr("id","media-item-"+e.id).addClass("child-of-"+r).append('<div class="progress"><div class="percent">0%</div><div class="bar"></div></div>',jQuery('<div class="filename original">').text(" "+e.name)).appendTo(jQuery("#media-items")),jQuery("#insert-gallery").prop("disabled",!0)}function uploadStart(){try{void 0!==topWin.tb_remove&&topWin.jQuery("#TB_overlay").unbind("click",topWin.tb_remove)}catch(e){}return!0}function uploadProgress(e,a){var r=jQuery("#media-item-"+a.id);jQuery(".bar",r).width(200*a.loaded/a.size),jQuery(".percent",r).html(a.percent+"%")}function fileUploading(e,a){var r=104857600;r<parseInt(e.settings.max_file_size,10)&&a.size>r&&setTimeout(function(){a.status<3&&0===a.loaded&&(wpFileError(a,pluploadL10n.big_upload_failed.replace("%1$s",'<a class="uploader-html" href="#">').replace("%2$s","</a>")),e.stop(),e.removeFile(a),e.start())},1e4)}function updateMediaForm(){var e=jQuery("#media-items").children();1==e.length?(e.addClass("open").find(".slidetoggle").show(),jQuery(".insert-gallery").hide()):1<e.length&&(e.removeClass("open"),jQuery(".insert-gallery").show()),0<e.not(".media-blank").length?jQuery(".savebutton").show():jQuery(".savebutton").hide()}function uploadSuccess(e,a){var r=jQuery("#media-item-"+e.id);"string"==typeof a&&(a=a.replace(/^<pre>(\d+)<\/pre>$/,"$1"),/media-upload-error|error-div/.test(a))?r.html(a):(r.find(".percent").html(pluploadL10n.crunching),prepareMediaItem(e,a),updateMediaForm(),post_id&&r.hasClass("child-of-"+post_id)&&jQuery("#attachments-count").text(+jQuery("#attachments-count").text()+1))}function setResize(e){e?window.resize_width&&window.resize_height?uploader.settings.resize={enabled:!0,width:window.resize_width,height:window.resize_height,quality:100}:uploader.settings.multipart_params.image_resize=!0:delete uploader.settings.multipart_params.image_resize}function prepareMediaItem(e,a){var r="undefined"==typeof shortform?1:2,i=jQuery("#media-item-"+e.id);2==r&&2<shortform&&(r=shortform);try{void 0!==topWin.tb_remove&&topWin.jQuery("#TB_overlay").click(topWin.tb_remove)}catch(e){}isNaN(a)||!a?(i.append(a),prepareMediaItemInit(e)):i.load("async-upload.php",{attachment_id:a,fetch:r},function(){prepareMediaItemInit(e),updateMediaForm()})}function prepareMediaItemInit(r){var e=jQuery("#media-item-"+r.id);jQuery(".thumbnail",e).clone().attr("class","pinkynail toggle").prependTo(e),jQuery(".filename.original",e).replaceWith(jQuery(".filename.new",e)),jQuery("a.delete",e).on("click",function(){return jQuery.ajax({url:ajaxurl,type:"post",success:deleteSuccess,error:deleteError,id:r.id,data:{id:this.id.replace(/[^0-9]/g,""),action:"trash-post",_ajax_nonce:this.href.replace(/^.*wpnonce=/,"")}}),!1}),jQuery("a.undo",e).on("click",function(){return jQuery.ajax({url:ajaxurl,type:"post",id:r.id,data:{id:this.id.replace(/[^0-9]/g,""),action:"untrash-post",_ajax_nonce:this.href.replace(/^.*wpnonce=/,"")},success:function(){var e,a=jQuery("#media-item-"+r.id);(e=jQuery("#type-of-"+r.id).val())&&jQuery("#"+e+"-counter").text(+jQuery("#"+e+"-counter").text()+1),post_id&&a.hasClass("child-of-"+post_id)&&jQuery("#attachments-count").text(+jQuery("#attachments-count").text()+1),jQuery(".filename .trashnotice",a).remove(),jQuery(".filename .title",a).css("font-weight","normal"),jQuery("a.undo",a).addClass("hidden"),jQuery(".menu_order_input",a).show(),a.css({backgroundColor:"#ceb"}).animate({backgroundColor:"#fff"},{queue:!1,duration:500,complete:function(){jQuery(this).css({backgroundColor:""})}}).removeClass("undo")}}),!1}),jQuery("#media-item-"+r.id+".startopen").removeClass("startopen").addClass("open").find("slidetoggle").fadeIn()}function wpQueueError(e){jQuery("#media-upload-error").show().html('<div class="error"><p>'+e+"</p></div>")}function wpFileError(e,a){itemAjaxError(e.id,a)}function itemAjaxError(e,a){var r=jQuery("#media-item-"+e),i=r.find(".filename").text();r.data("last-err")!=e&&r.html('<div class="error-div"><a class="dismiss" href="#">'+pluploadL10n.dismiss+"</a><strong>"+pluploadL10n.error_uploading.replace("%s",jQuery.trim(i))+"</strong> "+a+"</div>").data("last-err",e)}function deleteSuccess(e){var a;return"-1"==e?itemAjaxError(this.id,"You do not have permission. Has your session expired?"):"0"==e?itemAjaxError(this.id,"Could not be deleted. Has it been deleted already?"):(e=this.id,a=jQuery("#media-item-"+e),(e=jQuery("#type-of-"+e).val())&&jQuery("#"+e+"-counter").text(jQuery("#"+e+"-counter").text()-1),post_id&&a.hasClass("child-of-"+post_id)&&jQuery("#attachments-count").text(jQuery("#attachments-count").text()-1),1==jQuery("form.type-form #media-items").children().length&&0<jQuery(".hidden","#media-items").length&&(jQuery(".toggle").toggle(),jQuery(".slidetoggle").slideUp(200).siblings().removeClass("hidden")),jQuery(".toggle",a).toggle(),jQuery(".slidetoggle",a).slideUp(200).siblings().removeClass("hidden"),a.css({backgroundColor:"#faa"}).animate({backgroundColor:"#f4f4f4"},{queue:!1,duration:500}).addClass("undo"),jQuery(".filename:empty",a).remove(),jQuery(".filename .title",a).css("font-weight","bold"),jQuery(".filename",a).append('<span class="trashnotice"> '+pluploadL10n.deleted+" </span>").siblings("a.toggle").hide(),jQuery(".filename",a).append(jQuery("a.undo",a).removeClass("hidden")),void jQuery(".menu_order_input",a).hide())}function deleteError(){}function uploadComplete(){jQuery("#insert-gallery").prop("disabled",!1)}function switchUploader(e){e?(deleteUserSetting("uploader"),jQuery(".media-upload-form").removeClass("html-uploader"),"object"==typeof uploader&&uploader.refresh()):(setUserSetting("uploader","1"),jQuery(".media-upload-form").addClass("html-uploader"))}function uploadError(e,a,r,i){var t=104857600;switch(a){case plupload.FAILED:wpFileError(e,pluploadL10n.upload_failed);break;case plupload.FILE_EXTENSION_ERROR:wpFileExtensionError(i,e,pluploadL10n.invalid_filetype);break;case plupload.FILE_SIZE_ERROR:uploadSizeError(i,e);break;case plupload.IMAGE_FORMAT_ERROR:wpFileError(e,pluploadL10n.not_an_image);break;case plupload.IMAGE_MEMORY_ERROR:wpFileError(e,pluploadL10n.image_memory_exceeded);break;case plupload.IMAGE_DIMENSIONS_ERROR:wpFileError(e,pluploadL10n.image_dimensions_exceeded);break;case plupload.GENERIC_ERROR:wpQueueError(pluploadL10n.upload_failed);break;case plupload.IO_ERROR:t<parseInt(i.settings.filters.max_file_size,10)&&e.size>t?wpFileError(e,pluploadL10n.big_upload_failed.replace("%1$s",'<a class="uploader-html" href="#">').replace("%2$s","</a>")):wpQueueError(pluploadL10n.io_error);break;case plupload.HTTP_ERROR:wpQueueError(pluploadL10n.http_error);break;case plupload.INIT_ERROR:jQuery(".media-upload-form").addClass("html-uploader");break;case plupload.SECURITY_ERROR:wpQueueError(pluploadL10n.security_error);break;default:wpFileError(e,pluploadL10n.default_error)}}function uploadSizeError(e,a){var r=pluploadL10n.file_exceeds_size_limit.replace("%s",a.name),r=jQuery("<div />").attr({id:"media-item-"+a.id,class:"media-item error"}).append(jQuery("<p />").text(r));jQuery("#media-items").append(r),e.removeFile(a)}function wpFileExtensionError(e,a,r){jQuery("#media-items").append('<div id="media-item-'+a.id+'" class="media-item error"><p>'+r+"</p></div>"),e.removeFile(a)}function copyAttachmentUploadURLClipboard(){var i;new ClipboardJS(".copy-attachment-url").on("success",function(e){var a=jQuery(e.trigger),r=jQuery(".success",a.closest(".copy-to-clipboard-container"));e.clearSelection(),a.trigger("focus"),clearTimeout(i),r.removeClass("hidden"),i=setTimeout(function(){r.addClass("hidden")},3e3),wp.a11y.speak(pluploadL10n.file_url_copied)})}jQuery(document).ready(function(o){copyAttachmentUploadURLClipboard();var d,l={};o(".media-upload-form").bind("click.uploader",function(e){var a,r=o(e.target);r.is('input[type="radio"]')?(a=r.closest("tr")).hasClass("align")?setUserSetting("align",r.val()):a.hasClass("image-size")&&setUserSetting("imgsize",r.val()):r.is("button.button")?(a=(a=e.target.className||"").match(/url([^ '"]+)/))&&a[1]&&(setUserSetting("urlbutton",a[1]),r.siblings(".urlfield").val(r.data("link-url"))):r.is("a.dismiss")?r.parents(".media-item").fadeOut(200,function(){o(this).remove()}):r.is(".upload-flash-bypass a")||r.is("a.uploader-html")?(o("#media-items, p.submit, span.big-file-warning").css("display","none"),switchUploader(0),e.preventDefault()):r.is(".upload-html-bypass a")?(o("#media-items, p.submit, span.big-file-warning").css("display",""),switchUploader(1),e.preventDefault()):r.is("a.describe-toggle-on")?(r.parent().addClass("open"),r.siblings(".slidetoggle").fadeIn(250,function(){var e=o(window).scrollTop(),a=o(window).height(),r=o(this).offset().top,i=o(this).height();a&&r&&i&&(a=e+a)<(i=r+i)&&(i-a<r-e?window.scrollBy(0,i-a+10):window.scrollBy(0,r-e-40))}),e.preventDefault()):r.is("a.describe-toggle-off")&&(r.siblings(".slidetoggle").fadeOut(250,function(){r.parent().removeClass("open")}),e.preventDefault())}),d=function(a,r){var e,i,t=r.file;if(r&&r.responseHeaders)if((i=r.responseHeaders.match(/x-wp-upload-attachment-id:\s*(\d+)/i))&&i[1]){if(i=i[1],(e=l[t.id])&&4<e)return o.ajax({type:"post",url:ajaxurl,dataType:"json",data:{action:"media-create-image-subsizes",_wpnonce:wpUploaderInit.multipart_params._wpnonce,attachment_id:i,_wp_upload_failed_cleanup:!0}}),void(r.message&&(r.status<500||600<=r.status)?wpQueueError(r.message):wpQueueError(pluploadL10n.http_error_image));l[t.id]=e?++e:1,o.ajax({type:"post",url:ajaxurl,dataType:"json",data:{action:"media-create-image-subsizes",_wpnonce:wpUploaderInit.multipart_params._wpnonce,attachment_id:i,_legacy_support:"true"}}).done(function(e){var a;e.success?uploadSuccess(t,e.data.id):wpQueueError((a=e.data&&e.data.message?e.data.message:a)||pluploadL10n.http_error_image)}).fail(function(e){500<=e.status&&e.status<600?d(a,r):wpQueueError(pluploadL10n.http_error_image)})}else wpQueueError(pluploadL10n.http_error_image);else wpQueueError(pluploadL10n.http_error_image)},uploader_init=function(){uploader=new plupload.Uploader(wpUploaderInit),o("#image_resize").bind("change",function(){var e=o(this).prop("checked");setResize(e),e?setUserSetting("upload_resize","1"):deleteUserSetting("upload_resize")}),uploader.bind("Init",function(e){var a=o("#plupload-upload-ui");setResize(getUserSetting("upload_resize",!1)),e.features.dragdrop&&!o(document.body).hasClass("mobile")?(a.addClass("drag-drop"),o("#drag-drop-area").on("dragover.wp-uploader",function(){a.addClass("drag-over")}).on("dragleave.wp-uploader, drop.wp-uploader",function(){a.removeClass("drag-over")})):(a.removeClass("drag-drop"),o("#drag-drop-area").off(".wp-uploader")),"html4"===e.runtime&&o(".upload-flash-bypass").hide()}),uploader.bind("postinit",function(e){e.refresh()}),uploader.init(),uploader.bind("FilesAdded",function(a,e){o("#media-upload-error").empty(),uploadStart(),plupload.each(e,function(e){if("image/heic"===e.type&&a.settings.heic_upload_error)wpQueueError(pluploadL10n.unsupported_image);else if("image/webp"===e.type&&a.settings.webp_upload_error)return wpQueueError(pluploadL10n.noneditable_image),void a.removeFile(e);fileQueued(e)}),a.refresh(),a.start()}),uploader.bind("UploadFile",function(e,a){fileUploading(e,a)}),uploader.bind("UploadProgress",function(e,a){uploadProgress(e,a)}),uploader.bind("Error",function(e,a){var r=a.file&&a.file.type&&0===a.file.type.indexOf("image/"),i=a&&a.status;r&&500<=i&&i<600?d(e,a):(uploadError(a.file,a.code,a.message,e),e.refresh())}),uploader.bind("FileUploaded",function(e,a,r){uploadSuccess(a,r.response)}),uploader.bind("UploadComplete",function(){uploadComplete()})},"object"==typeof wpUploaderInit&&uploader_init()});