package {

	// Flash imports
	import flash.display.Sprite;
	import flash.external.ExternalInterface;
	import flash.events.*;

	import flash.utils.setInterval;

	// Custom imports
	import FlashElementEvent;


	public class FlashElement extends Sprite {

		// The JS instance bridge to use for ExternalInterface
		private var bridge:String = 'FlashElement.instances["' + ExternalInterface.objectID + '"]';


		/**
			The main FlashElement constructor
			@constructor
		*/
		public function FlashElement():void {
			// Wait for the stage to be available
			this.addEventListener(Event.ADDED_TO_STAGE, init);
		} // end of constructor


		/**
			Initialize the application.
			@private @function

			@param {Event} e The ADDED_TO_STAGE event
		*/
		private function init(e:Event):void {
			// Dispatch the stage's click event to the DOM
			stage.addEventListener(MouseEvent.CLICK, FlashElementEvent.dispatch);

			// Call a "blip" custom event every 5 seconds
			setInterval(function() {
				FlashElementEvent.dispatch("blip");
			}, 5000);

			// Tell the bridge this element is ready
			ExternalInterface.call(this.bridge + ".ready");
		} // end of init()

	} // end of class

} // end of package