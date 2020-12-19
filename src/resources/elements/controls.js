import { inject, bindable } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';

@inject(EventAggregator)
export class ControlsCustomElement {

	constructor(eventAggregator) {
		this._eventAggregator = eventAggregator;
		this.tucked = true;
		this.setupMode = true;
		this.removeCandidates = false;
		this.hideTimeoutHandle = undefined;
		this.thinkingProgress = 0;
		this.singleCandidates = false;
	}

	attached() {
		this._addListeners();
		this.toggleSetupMode();
	}

	detached() {
		this._thinkingProgressListener.dispose();
	}

	_addListeners() {
		this._thinkingProgressListener = this._eventAggregator.subscribe('thinkingProgress', thinking => {
			if (this.thinkingProgress == 0) {
				this.progressFactor = 0;
			}
			if (this.progressFactor == 0 && thinking.progress > 1) {
				this.progressFactor = 100 / thinking.progress;
			}
			this.thinkingProgress = thinking.progress * this.progressFactor;
		});
	}

	toggleControls() {
		this.tucked = !this.tucked;
	}

	resetGrid() {
		this.removeCandidates = false;
		this.singleCandidates = false;
		this.setRemoveCandidates();
		this.setSingleCandidates();
		this._eventAggregator.publish('resetGrid');
	}

	solveIt() {
		this.removeCandidates = true;
		this.singleCandidates = true;
		this.setRemoveCandidates();
		this.setSingleCandidates();
		setTimeout(_ => {
			this._eventAggregator.publish('solveIt');
		});
	}

	toggleSetupMode() {
		this._eventAggregator.publish('toggleSetupMode', { 'setupMode': this.setupMode });
	}

	setRemoveCandidates() {
		this._eventAggregator.publish('setAutosolve', { 'autosolve': this.removeCandidates });
	}

	setSingleCandidates() {
		this._eventAggregator.publish('setSingleCandidates', { 'singleCandidates': this.singleCandidates });
	}

}
