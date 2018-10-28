// Preset.js
// **********

module.exports = {

}

function Preset() {
	// **************************************************
	// ******************** Private *********************

	var num_walls = 0

	this.save = (_slug) => {
		// If the preset exists already
		if (Preset.presets.includes(_slug)) {

		}
	}

	// ***************** End of Private *****************
	// **************************************************


	// **************************************************
	// ******************** Public **********************

	Preset.presets = []

	/** Deletes a preset */
	Preset.Delete = (_slug) => {

	}

	/** Saves / Creates a preset */
	Preset.Save = (_slug, _data) => {
		// If it exists
		if (Preset.presets.includes(_slug)) {
			// Overwrite
			Preset.presets
		}
	}

	Preset.Load = (_slug) => {

	}
}
