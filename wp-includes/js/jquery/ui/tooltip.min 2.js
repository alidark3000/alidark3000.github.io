/*!
 * jQuery UI Tooltip 1.13.1
 * http://jqueryui.com
 *
 * Copyright jQuery Foundation and other contributors
 * Released under the MIT license.
 * http://jquery.org/license
 */
!function(t){"use strict";"function"==typeof define&&define.amd?define(["jquery","./core"],t):t(jQuery)}(function(r){"use strict";return r.widget("ui.tooltip",{version:"1.13.1",options:{classes:{"ui-tooltip":"ui-corner-all ui-widget-shadow"},content:function(){var t=r(this).attr("title");return r("<a>").text(t).html()},hide:!0,items:"[title]:not([disabled])",position:{my:"left top+15",at:"left bottom",collision:"flipfit flip"},show:!0,track:!1,close:null,open:null},_addDescribedBy:function(t,i){var e=(t.attr("aria-describedby")||"").split(/\s+/);e.push(i),t.data("ui-tooltip-id",i).attr("aria-describedby",String.prototype.trim.call(e.join(" ")))},_removeDescribedBy:function(t){var i=t.data("ui-tooltip-id"),e=(t.attr("aria-describedby")||"").split(/\s+/),i=r.inArray(i,e);-1!==i&&e.splice(i,1),t.removeData("ui-tooltip-id"),(e=String.prototype.trim.call(e.join(" ")))?t.attr("aria-describedby",e):t.removeAttr("aria-describedby")},_create:function(){this._on({mouseover:"open",focusin:"open"}),this.tooltips={},this.parents={},this.liveRegion=r("<div>").attr({role:"log","aria-live":"assertive","aria-relevant":"additions"}).appendTo(this.document[0].body),this._addClass(this.liveRegion,null,"ui-helper-hidden-accessible"),this.disabledTitles=r([])},_setOption:function(t,i){var e=this;this._super(t,i),"content"===t&&r.each(this.tooltips,function(t,i){e._updateContent(i.element)})},_setOptionDisabled:function(t){this[t?"_disable":"_enable"]()},_disable:function(){var o=this;r.each(this.tooltips,function(t,i){var e=r.Event("blur");e.target=e.currentTarget=i.element[0],o.close(e,!0)}),this.disabledTitles=this.disabledTitles.add(this.element.find(this.options.items).addBack().filter(function(){var t=r(this);if(t.is("[title]"))return t.data("ui-tooltip-title",t.attr("title")).removeAttr("title")}))},_enable:function(){this.disabledTitles.each(function(){var t=r(this);t.data("ui-tooltip-title")&&t.attr("title",t.data("ui-tooltip-title"))}),this.disabledTitles=r([])},open:function(t){var e=this,i=r(t?t.target:this.element).closest(this.options.items);i.length&&!i.data("ui-tooltip-id")&&(i.attr("title")&&i.data("ui-tooltip-title",i.attr("title")),i.data("ui-tooltip-open",!0),t&&"mouseover"===t.type&&i.parents().each(function(){var t,i=r(this);i.data("ui-tooltip-open")&&((t=r.Event("blur")).target=t.currentTarget=this,e.close(t,!0)),i.attr("title")&&(i.uniqueId(),e.parents[this.id]={element:this,title:i.attr("title")},i.attr("title",""))}),this._registerCloseHandlers(t,i),this._updateContent(i,t))},_updateContent:function(i,e){var t=this.options.content,o=this,n=e?e.type:null;if("string"==typeof t||t.nodeType||t.jquery)return this._open(e,i,t);(t=t.call(i[0],function(t){o._delay(function(){i.data("ui-tooltip-open")&&(e&&(e.type=n),this._open(e,i,t))})}))&&this._open(e,i,t)},_open:function(t,i,e){var o,n,s,l=r.extend({},this.options.position);function a(t){l.of=t,o.is(":hidden")||o.position(l)}e&&((s=this._find(i))?s.tooltip.find(".ui-tooltip-content").html(e):(i.is("[title]")&&(t&&"mouseover"===t.type?i.attr("title",""):i.removeAttr("title")),s=this._tooltip(i),o=s.tooltip,this._addDescribedBy(i,o.attr("id")),o.find(".ui-tooltip-content").html(e),this.liveRegion.children().hide(),(s=r("<div>").html(o.find(".ui-tooltip-content").html())).removeAttr("name").find("[name]").removeAttr("name"),s.removeAttr("id").find("[id]").removeAttr("id"),s.appendTo(this.liveRegion),this.options.track&&t&&/^mouse/.test(t.type)?(this._on(this.document,{mousemove:a}),a(t)):o.position(r.extend({of:i},this.options.position)),o.hide(),this._show(o,this.options.show),this.options.track&&this.options.show&&this.options.show.delay&&(n=this.delayedShow=setInterval(function(){o.is(":visible")&&(a(l.of),clearInterval(n))},13)),this._trigger("open",t,{tooltip:o})))},_registerCloseHandlers:function(t,i){var e={keyup:function(t){t.keyCode===r.ui.keyCode.ESCAPE&&((t=r.Event(t)).currentTarget=i[0],this.close(t,!0))}};i[0]!==this.element[0]&&(e.remove=function(){var t=this._find(i);t&&this._removeTooltip(t.tooltip)}),t&&"mouseover"!==t.type||(e.mouseleave="close"),t&&"focusin"!==t.type||(e.focusout="close"),this._on(!0,i,e)},close:function(t){var i,e=this,o=r(t?t.currentTarget:this.element),n=this._find(o);n?(i=n.tooltip,n.closing||(clearInterval(this.delayedShow),o.data("ui-tooltip-title")&&!o.attr("title")&&o.attr("title",o.data("ui-tooltip-title")),this._removeDescribedBy(o),n.hiding=!0,i.stop(!0),this._hide(i,this.options.hide,function(){e._removeTooltip(r(this))}),o.removeData("ui-tooltip-open"),this._off(o,"mouseleave focusout keyup"),o[0]!==this.element[0]&&this._off(o,"remove"),this._off(this.document,"mousemove"),t&&"mouseleave"===t.type&&r.each(this.parents,function(t,i){r(i.element).attr("title",i.title),delete e.parents[t]}),n.closing=!0,this._trigger("close",t,{tooltip:i}),n.hiding||(n.closing=!1))):o.removeData("ui-tooltip-open")},_tooltip:function(t){var i=r("<div>").attr("role","tooltip"),e=r("<div>").appendTo(i),o=i.uniqueId().attr("id");return this._addClass(e,"ui-tooltip-content"),this._addClass(i,"ui-tooltip","ui-widget ui-widget-content"),i.appendTo(this._appendTo(t)),this.tooltips[o]={element:t,tooltip:i}},_find:function(t){t=t.data("ui-tooltip-id");return t?this.tooltips[t]:null},_removeTooltip:function(t){clearInterval(this.delayedShow),t.remove(),delete this.tooltips[t.attr("id")]},_appendTo:function(t){t=t.closest(".ui-front, dialog");return t=t.length?t:this.document[0].body},_destroy:function(){var o=this;r.each(this.tooltips,function(t,i){var e=r.Event("blur"),i=i.element;e.target=e.currentTarget=i[0],o.close(e,!0),r("#"+t).remove(),i.data("ui-tooltip-title")&&(i.attr("title")||i.attr("title",i.data("ui-tooltip-title")),i.removeData("ui-tooltip-title"))}),this.liveRegion.remove()}}),!1!==r.uiBackCompat&&r.widget("ui.tooltip",r.ui.tooltip,{options:{tooltipClass:null},_tooltip:function(){var t=this._superApply(arguments);return this.options.tooltipClass&&t.tooltip.addClass(this.options.tooltipClass),t}}),r.ui.tooltip});