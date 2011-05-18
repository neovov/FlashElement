/**
	@author <a href="mailto:me@neovov.com">Nicolas Le Gall</a>
*/

(function(){

	var
		/**
			Is Bad Browser?
			@private
			@type {boolean}
		*/
		isBB = !!document.attachEvent,

		/**
			The events type and event interfaces to be used for creating a new event
			@private
			@type {object}
		*/
		eventsTypes = {
			FocusEvent: "blur focus focusin focusout",
			MouseEvent: "click dblclick mousedown mouseenter mouseleave mousemove mouseout mouseover mouseup",
			WheelEvent: "wheel",
			KeyboardEvent: "keydown keypress keyup"
		},

		// The event types which are not cancelable and don't bubbles
		dontBubbles   = /blur|focus|mouseenter|mouseleave/,
		notCancelable = /blur|focus|mouseenter|mouseleave|focusin|focusout/,

		/**
			The default options
			@private
			@type {object}
		*/
		options = {
			attributes: {
				width:  720,
				height: 400,
				type: "application/x-shockwave-flash",
				data: "FlashElement.swf"
			},
			params: {
				allowscriptaccess: "always",
				wmode: "transparent"
			}
		};


	/**
		Format an object to a specific string
		@private @function

		@param {string} mode The mode to use to generate the output
		@param {object} obj The object source, to be stringified

		@returns {string} The stringified obj according to the mode
	*/
	function formatTo(mode, obj) {
		var
			config = {
				attribute: ['%attribute%="%value%"', " "],
				param: ['<param name="%param%" value="%value%" />', "\n"],
				object: ['%object%=%value%', "&amp;"]
			},
			template = config[mode][0],
			glue = config[mode][1],
			output = [],
			key, value;

		for (key in obj) {
			value = typeof obj[key] === "object" ? formatTo("object", obj[key]) : obj[key];
			output.push(template.replace("%" + mode + "%", key).replace("%value%", value));
		}

		return output.join(glue);
	} // end of formatTo()


	/**
		Correct an object with default values if no provided or if the source key is not lowercased
		@private @function

		@param {object} source The source object to check and correct
		@param {object} options The default object to use as base for the checking

		@returns {object} The corrected object
	*/
	function correctWithDefault(source, options) {
		var key, rKey, badKey, keys = [];

		// Get the source keys, we can't use object.keys because of browsers inconsistencies
		for (key in source) { keys.push(key); }
		keys = keys.join(" ");

		for (key in options) {
			// Search the source keys to find this key, no matter the case
			rKey = new RegExp("(" + key + ")", "i");
			badKey = keys.match(rKey);
			badKey = badKey ? badKey[0] : badKey; // Use the first match or null

			// Store the good key/value in the ouput object
			source[key] = source[key] || source[badKey] || options[key];

			// Make sure to remove a bad key (because we just corrected it)
			if (key !== badKey) {
				delete source[badKey];
			}
		}

		return source;
	} // end of correctWithDefault()


	/**
		A FlashElement's bridge
		@class @constructor
	*/
	function FlashElement() {
		var
			id  = arguments.length === 1 ? (typeof arguments[0] === "string" ? arguments[0] : undefined) : arguments[0],
			obj = arguments.length === 1 ? (typeof arguments[0] === "object" ? arguments[0] : undefined) : arguments[1];

		// Make sure we have an ID. Can be argument provided or automatic (calculated with instances count)
		this.id = id = id || "fe-" + (FlashElement.instances.length + 1);

		if (!FlashElement.instances[id]) {
			FlashElement.instances[id] = this;
			FlashElement.instances.length++;
		} else {
			// This instance already exists
			return FlashElement.instances[id];
		}

		// Make sure we have something in obj
		obj = obj || {};
		obj.attributes = obj.attr || obj.attributes || {};
		obj.params = obj.params || {};

		// We have flashvars (what a mess)
		if (obj.flashvars || obj.params.flashvars) {
			obj.params.flashvars = obj.flashvars || obj.params.flashvars;
		}

		// Clean a bit the ugly things…
		delete obj.attr;
		delete obj.flashvars;

		// Correct the attributes
		obj.attributes = correctWithDefault(obj.attributes, options.attributes);

		// Makes sure we have an ID & name attribute for ExternalInterface
		obj.attributes.id = obj.attributes.name = obj.attributes.id || this.id;

		// Correct the params
		obj.params = correctWithDefault(obj.params, options.params);

		// Alert, bad browser detected, make a little change in the configuration
		if (isBB) {
			obj.attributes.classid = "clsid:D27CDB6E-AE6D-11cf-96B8-444553540000";
			obj.params.movie = obj.attributes.data;
			delete obj.attributes.data;
			delete obj.attributes.type;
		}

		// Prepare the instance's SWF options
		this.options = obj;
	} // end of FlashElement()


	// Instances cache. Set a length property to fake an array
	FlashElement.instances = { length: 0 };


	FlashElement.prototype = {
		/**
			Expose an event received from the &lt;object&gt; to the DOM
			@function

			@param {object} source The received event from the &lt;object&gt;
		*/
		exposeEvent: function(source) {
			var
				// Default arguments for calling createEvent
				args = [
					source.type, // event.type
					!dontBubbles.test(source.type), // event.bubble
					!notCancelable.test(source.type), // event.cancelable
					window, // event.view
					0 // event.details (TODO: click, dblclick, mousedown, mouseup)
				],
				prop,
				event, // The event to be triggered
				eventType, // [for IE] Event type to check if we're dealing with custom events or regular, prefixed with "on"
				eventInterface, // The Event Interface for the source type
				eventPattern = new RegExp(source.type); // A pattern to easily find the eventInterface

			// Loop through eventsTypes to find the right Event Interface to use
			for (eventInterface in eventsTypes) {
				// Found the right interface to use!
				if (eventPattern.test(eventsTypes[eventInterface])) {
					eventType = "on" + source.type;
					break;
				}

				// If the loop hasn't been broken, we didn't find the right Interface, use a default one
				eventInterface = "Event";
			}

			// Create the new Event according to the right interface (for good browsers)
			if (document.createEvent) {
				// Create the new event and initialize it!
				event = document.createEvent(eventInterface);
				event["init" + eventInterface].apply(event, args);
			} else if (document.createEventObject) {
				event = document.createEventObject();
			} // else we are doomed

			// Re-copy the source's property and value in the new event
			for (prop in source) {
				// Skip overriding the type property to avoid crash on old Firefox versions (prior to 4)
				if (document.createEvent && prop === "type") {
					continue;
				}

				event[prop] = source[prop];
			}

			// Setting the relatedTarget if necessary
			if (event.type === "focusin" || event.type === "focusout") {
				// (TODO)
				//event.relatedTarget = null;
			}

			// Calculate the right screenX and screenY
			if (event.screenX) {
				event.screenX = 0; // (TODO)
				event.screenY = 0; // (TODO)
			}

			// Setting the right delta in case of MouseWheel event
			if (event.deltaY) {
				event.deltaX = 0;
				event.deltaZ = 0;
			}

			// Dispatch the event
			if (this.element.dispatchEvent) {
				this.element.dispatchEvent(event);
			} else if (this.element.fireEvent) {
				if (!eventType) {
					// Custom events! Wrap the event in a new event that IE can understand
					eventType = !dontBubbles.test(event.type) ? "ondataavailable" : "onlosecapture";
					source = event;
					event  = document.createEventObject();
					event.originalEvent = source;
				}
				this.element.fireEvent(eventType, event);
			} // else we are doomed (again)
		}, // end of exposeEvent()


		ready: function() {
			console.info("Flash Player and JS bridge ready");
		}, // end of ready()


		// WIP
		// TODO: onDOMLoaded
		create: function() {
			var
				container,
				element = typeof arguments[0] === "string" ? document.getElementById(arguments[0]) : arguments[0],
				markup = "<object " + formatTo("attribute", this.options.attributes) + ">" + formatTo("param", this.options.params) + "</object>";

			// No node found, abort
			if (!element) {
				return;
			}

			if (isBB) {
				// Bad Browser (IE6, 7 & 8), better to use outerHTML
				element.outerHTML = markup;
				this.element = document.getElementById(this.id);
			} else {
				// Turn the <object> string into a DOM Object
				container = document.createElement("div");
				container.innerHTML = markup;

				// Get the DOM Object <object>
				this.element = container.firstChild;

				// Replace the element with the brand new <object>
				element.parentNode.replaceChild(this.element, element);
			}

			return this.element;
		} // end of create()

	}; // end of FlashElement.prototype


	// Expose
	window.FlashElement = FlashElement;

}());
