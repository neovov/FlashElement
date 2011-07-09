# Wait… What? #

Haven't you ever been bored to simply make this:

	my_object_element.addEventListener("click", handleFreakinClick, false);

And just handle it like a regular &lt;div&gt; or whatever?
Well… I do, so I tested this proof of concept and it seems to work.

# Features #

- Can dispatch AS3 events or custom events (make a new Event("whatever")) to the DOM
- Communicate to a JS bridge which can create the markup too (SWFObject style, but… lighter)
- Clean existing AS3 events to dispatch them to the DOM. Some AS3 events' properties doesn't make sense on the DOM (such as event.stage)
- Custom events can be used via ondataavailable and onlosecapture in IE which doesn't support custom events on a tag. Have a look at the example.html to see how to handle it
- No framework needed (nor SWFObject)

# How to use #

In AS3 :

	FlashElement.dispatch("custom"); // I want a custom event, create a bulk one

or

	FlashElement.dispatch(event); // Dispatch an existing event (MouseEvent, KeyboardEvent, etc)

In JS :

1. Create a bridge instance:

	new FlashElement(); // Fully automatic
	new FlashElement("player_id"); // Define the object ID and use default options (attributes, flashvars)
	new FlashElement("player_id", options); // Define the object ID and use specific options (will be merged to default)
	new FlashElement(options); // Set automagically an ID and use specific options

2. Create the &lt;object&gt; and replace a dummy node (I know, this method name is crappy)

	instance.create("dummy_node"); // Return the &lt;object&gt; element

3. Register some listerners

	element.addEventListener("click", handler, false); // Good browsers
	element.attachEvent("click", handler); // Bad browsers

4. Have a beer

# TODO #

A LOT! Go on, fork it!

# Bugs #

A lot I think, it's a proof of concept. I'd be please to solve issues if you notice me ;).