/*! This file is auto-generated */
!function(o){var i=0,e=9999;o.widget("wp.pointer",{options:{pointerClass:"wp-pointer",pointerWidth:320,content:function(){return o(this).text()},buttons:function(t,i){return o('<a class="close" href="#"></a>').text(wp.i18n.__("Dismiss")).on("click.pointer",function(t){t.preventDefault(),i.element.pointer("close")})},position:"top",show:function(t,i){i.pointer.show(),i.opened()},hide:function(t,i){i.pointer.hide(),i.closed()},document:document},_create:function(){var t;this.content=o('<div class="wp-pointer-content"></div>'),this.arrow=o('<div class="wp-pointer-arrow"><div class="wp-pointer-arrow-inner"></div></div>'),t="absolute",this.element.parents().add(this.element).filter(function(){return"fixed"===o(this).css("position")}).length&&(t="fixed"),this.pointer=o("<div />").append(this.content).append(this.arrow).attr("id","wp-pointer-"+i++).addClass(this.options.pointerClass).css({position:t,width:this.options.pointerWidth+"px",display:"none"}).appendTo(this.options.document.body)},_setOption:function(t,i){var e=this.options,n=this.pointer;"document"===t&&i!==e.document?n.detach().appendTo(i.body):"pointerClass"===t&&n.removeClass(e.pointerClass).addClass(i),o.Widget.prototype._setOption.apply(this,arguments),"position"===t?this.reposition():"content"===t&&this.active&&this.update()},destroy:function(){this.pointer.remove(),o.Widget.prototype.destroy.call(this)},widget:function(){return this.pointer},update:function(i){var e=this,t=this.options,n=o.Deferred();if(!t.disabled)return n.done(function(t){e._update(i,t)}),(t="string"==typeof t.content?t.content:t.content.call(this.element[0],n.resolve,i,this._handoff()))&&n.resolve(t),n.promise()},_update:function(t,i){var e=this.options;i&&(this.pointer.stop(),this.content.html(i),(i=e.buttons.call(this.element[0],t,this._handoff()))&&i.wrap('<div class="wp-pointer-buttons" />').parent().appendTo(this.content),this.reposition())},reposition:function(){var t;this.options.disabled||(t=this._processPosition(this.options.position),this.pointer.css({top:0,left:0,zIndex:e++}).show().position(o.extend({of:this.element,collision:"fit none"},t)),this.repoint())},repoint:function(){var t=this.options;t.disabled||(t="string"==typeof t.position?t.position:t.position.edge,this.pointer[0].className=this.pointer[0].className.replace(/wp-pointer-[^\s'"]*/,""),this.pointer.addClass("wp-pointer-"+t))},_processPosition:function(t){var i={top:"bottom",bottom:"top",left:"right",right:"left"},t="string"==typeof t?{edge:t+""}:o.extend({},t);return t.edge&&("top"==t.edge||"bottom"==t.edge?(t.align=t.align||"left",t.at=t.at||t.align+" "+i[t.edge],t.my=t.my||t.align+" "+t.edge):(t.align=t.align||"top",t.at=t.at||i[t.edge]+" "+t.align,t.my=t.my||t.edge+" "+t.align)),t},open:function(t){var i=this,e=this.options;this.active||e.disabled||this.element.is(":hidden")||this.update().done(function(){i._open(t)})},_open:function(t){var i=this,e=this.options;this.active||e.disabled||this.element.is(":hidden")||(this.active=!0,this._trigger("open",t,this._handoff()),this._trigger("show",t,this._handoff({opened:function(){i._trigger("opened",t,i._handoff())}})))},close:function(t){var i;this.active&&!this.options.disabled&&((i=this).active=!1,this._trigger("close",t,this._handoff()),this._trigger("hide",t,this._handoff({closed:function(){i._trigger("closed",t,i._handoff())}})))},sendToTop:function(){this.active&&this.pointer.css("z-index",e++)},toggle:function(t){this.pointer.is(":hidden")?this.open(t):this.close(t)},_handoff:function(t){return o.extend({pointer:this.pointer,element:this.element},t)}})}(jQuery);