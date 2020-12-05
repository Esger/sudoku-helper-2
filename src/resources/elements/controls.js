import { inject, bindable } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';

@inject(EventAggregator)
export class ControlsCustomElement {

    constructor(eventAggregator) {
        this._eventAggregator = eventAggregator;
        this.tucked = true;
        this.setupMode = true;
        this.hideTimeoutHandle = undefined;
        this.thinkingProgress = 0;
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
		$('body').on('click', event => {
			if ($(event.target).closest('controls').length == 0) {
				this._hideControls();
			}
		});
	}

    showControls() {
        this.tucked = false;
    }

	_hideControls() {
        this.hideTimeoutHandle = setTimeout(_ => {
            this.tucked = true;
        }, 5000);
    }

    resetGrid() {
        this._eventAggregator.publish('resetGrid');
    }

    solveIt() {
        this._eventAggregator.publish('solveIt');
    }

    toggleSetupMode() {
        this._eventAggregator.publish('toggleSetupMode', { setupMode: this.setupMode });
    }
}