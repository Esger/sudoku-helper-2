import { BindingSignaler } from 'aurelia-templating-resources';
import { EventAggregator } from 'aurelia-event-aggregator';
import { inject, bindable } from 'aurelia-framework';
import { GridService } from 'resources/services/grid-service';

@inject(BindingSignaler, EventAggregator, GridService)
export class CellCustomElement {

	@bindable row
	@bindable col

	constructor(bindingSignaler, eventAggregator, gridService) {
		this._bindingSignaler = bindingSignaler;
		this._eventAggregator = eventAggregator;
		this._gridService = gridService;
		this._setupMode = true;
	}

	attached() {

		this._reset();

		this._resetListener = this._eventAggregator.subscribe('resetGrid', _ => {
			this._reset();
		});

		this._toggleSetupModeSubscriber = this._eventAggregator.subscribe('toggleSetupMode', data => {
			this._setupMode = data.setupMode;
		});

		this._sweepselfSubscriber = this._eventAggregator.subscribe('setCellValue', cell => {
			if (cell.props.row == this.row && cell.props.col == this.col) {
				this._setCellValue(cell.props.newValue);
			}
		});

		this._cellValueSetSubscriber = this._eventAggregator.subscribe('wipeRowColBlock', cell => {
			if (cell.props.row == this.row ||
				cell.props.col == this.col ||
				this._inThisBlock(cell.props.row, cell.props.col)) {
				this._removeCandidate(cell.props.value);
			}
		});

		this._sweepRowSubscriber = this._eventAggregator.subscribe('sweepRow', data => {
			let cell = data.cell;
			let omit = data.omit;
			if (this.row == cell.props.row && omit.indexOf(this.col) < 0) {
				this._removeCandidate(data.value);
			}
		});

		this._sweepColSubscriber = this._eventAggregator.subscribe('sweepCol', data => {
			let cell = data.cell;
			let omit = data.omit;
			if (this.col == cell.props.col && omit.indexOf(this.row) < 0) {
				this._removeCandidate(data.value);
			}
		});

		this._sweepColSubscriber = this._eventAggregator.subscribe('sweepBlock', data => {
			let cell = data.cell;
			let omit = data.omit;
			if (this._inThisBlock(cell.props.row, cell.props.col) && !this._inCells(omit)) {
				this._removeCandidate(data.value);
			}
		});
	}

	detached() {
		this._resetListener.dispose();
		this._toggleSetupModeSubscriber.dispose();
		this._sweepselfSubscriber.dispose();
		this._cellValueSetSubscriber.dispose();
		this._sweepRowSubscriber.dispose();
		this._sweepColSubscriber.dispose();
	}

	selectCandidate(value) {
		if (this._setupMode) {
			this._setCellValue(value);
		} else {
			this._removeCandidate(value);
		}
	}

	_setProps() {
		this.candidates = [0, 1, 2, 3, 4, 5, 6, 7, 8];
		this.value = -1;
		this.props = {
			value: this.value,
			row: this.row,
			col: this.col,
			rowBlock: this._index2Block(this.row),
			colBlock: this._index2Block(this.col)
		};
	}

	_reset() {
		this._setProps();
		this._registerCell();
		this._signalBindings();
	}

	_getCell() {
		return {
			props: this.props,
			candidates: this.candidates
		};
	}

	_registerCell() {
		this._gridService.registerCell(this._getCell());
	}

	_signalBindings() {
		this._bindingSignaler.signal('updateCandidates');
	}

	_addCheck() {
		this._eventAggregator.publish('addCheck');
	}

	_index2Block(index) {
		return Math.floor(index / 3);
	}

	_inCells(cells) {
		return cells.some(cell => {
			return cell[0] == this.row && cell[1] == this.col;
		});
	}

	_inThisBlock(row, col) {
		return this._index2Block(row) == this.props.rowBlock &&
			this._index2Block(col) == this.props.colBlock;
	}

	_removeCandidate(value) {
		if (this.candidates[value] >= 0) {
			this.candidates[value] = -1;
			this._eventAggregator.publish('candidateRemoved');
			this._addCheck();
			this._signalBindings();
			this._singleCandidateCheck();
		}
	}

	_setCellValue(value) {
		if (this.value < 0) {
			this.value = value;
			this.props.value = value;
			this.candidates = this.candidates.map(_ => -1);
			this._addCheck();
			this._eventAggregator.publish('wipeRowColBlock', this._getCell());
		}
	}

	_singleCandidateCheck() {
		let candidates = this.candidates.filter(candidate => {
			return candidate >= 0;
		});
		if (candidates.length == 1) {
			this._setCellValue(candidates[0]);
		}
	}

}
