import { inject, bindable } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';

@inject(EventAggregator)
export class ControlsCustomElement {

	constructor(eventAggregator) {
		this._eventAggregator = eventAggregator;
		this.setupMode = true;
		this.removeCandidates = false;
		this.singleCandidates = false;
		this.uniqueCandidates = false;
		this.candidateNtuples = false;
		this.excludedCandidates = false;
		this.hideTimeoutHandle = undefined;
		this.thinkingProgress = 0;
	}

	attached() {
		this._addListeners();
		this._eventAggregator.publish('toggleSetupMode', this.setupMode);
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

	resetGrid() {
		this.setRemoveCandidates(false);
		this._eventAggregator.publish('resetGrid');
	}

	solveIt() {
		this.setRemoveCandidates(true);
		setTimeout(_ => {
			this._eventAggregator.publish('solveIt');
		});
	}
	
	saveIt() {
		this._eventAggregator.publish('saveIt');
	}
	
	loadIt() {
		this.setRemoveCandidates(false);
		this._eventAggregator.publish('loadIt');
	}

	toggleSetupMode() {
		this.setupMode = !this.setupMode;
		this._eventAggregator.publish('toggleSetupMode', this.setupMode);
	}

	setRemoveCandidates(value) {
		console.log(value);
		this.removeCandidates = value;
		this._eventAggregator.publish('setAutosolve', value);
		if (value) return;

		this.setSingleCandidates(false);
		this.setUniqueCandidates(false);
		this.setCandidateNtuples(false);
		this.setExcludedCandidates(false);
	}

	setSingleCandidates(value) {
		this.singleCandidates = value;
		this._eventAggregator.publish('setSingleCandidates', value);
		if (!value) return;
		
		this.setRemoveCandidates(true);
	}
	
	setUniqueCandidates(value) {
		this.uniqueCandidates = value;
		this._eventAggregator.publish('setUniqueCandidates', value);
		if (!value) return;
		
		this.setRemoveCandidates(true);
	}
	
	setCandidateNtuples(value) {
		this.candidateNtuples = value;
		this._eventAggregator.publish('setCandidateNtuples', value);
		if (!value) return;
		
		this.setRemoveCandidates(true);
	}
	
	setExcludedCandidates(value) {
		this.excludedCandidates = value;
		this._eventAggregator.publish('setExcludedCandidates', value);
		if (!value) return;

		this.setRemoveCandidates(true);
	}

}
