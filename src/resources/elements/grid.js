import { BindingSignaler } from 'aurelia-templating-resources';
import { inject } from 'aurelia-framework';
import { EventAggregator } from 'aurelia-event-aggregator';
import { GridService } from 'resources/services/grid-service';

@inject(BindingSignaler, EventAggregator, GridService)
export class GridCustomElement {

	constructor(bindingSignaler, eventAggregator, gridService) {
		this._bindingSignaler = bindingSignaler;
		this._eventAggregator = eventAggregator;
		this._gridService = gridService;
		this._candidates = [0, 1, 2, 3, 4, 5, 6, 7, 8];
		this._blocks = [0, 1, 2];
		this._doChecks = 0;
		this._processHandleId = undefined;
		this.grid = this._candidates.map(row => this._candidates);
		this.autosolve = false;
	}

	attached() {
		this._addListeners();
		this._processGrid();
	}

	detached() {
		this._cellValueSetSubscriber.dispose();
		this._solveSubscriber.dispose();
		this._autosolveSubscriber.dispose();
		this._resetSubscriber.dispose();
		clearInterval(this._resetGridListener);
	}

	_addListeners() {
		this._cellValueSetSubscriber = this._eventAggregator.subscribe('addCheck', _ => {
			this._addCheck();
		});
		this._solveSubscriber = this._eventAggregator.subscribe('solveIt', _ => {
			this._addCheck();
		});
		this._autosolveSubscriber = this._eventAggregator.subscribe('setAutosolve', data => {
			this.autosolve = data.autosolve;
		});
		this._resetSubscriber = this._eventAggregator.subscribe('resetGrid', _ => {
			this._gridService.setCandidateRemoved(false);
		});
	}

	_addCheck() {
		this._doChecks = 2 * this.autosolve; // => 0 of 1
	}

	_removeCheck() {
		this._doChecks--;
	}

	_arrayContainsArray(searchArray, findArray) {
		let result = searchArray.some(element => {
			return element.every((value, index) => {
				return findArray[index] == value;
			});
		});
		return result;
	}

	_signalCellValuesFound(cells) {
		cells.forEach(cell => {
			this._eventAggregator.publish('setCellValue', cell);
		});
	}

	_findUniques() {
		let cells = this._gridService.findUniqueAreaCandidates();
		this._signalCellValuesFound(cells);
	}

	_findTuples() {
		[2, 3, 4, 5].forEach(tupleSize => {
			['rows', 'cols', 'blocks'].forEach(kind => {
				let tuples;
				switch (kind) {
					case 'rows': tuples = this._gridService.findTuples('rows', tupleSize);
						break;
					case 'cols': tuples = this._gridService.findTuples('cols', tupleSize);
						break;
					case 'blocks': tuples = this._gridService.findTuples('blocks', tupleSize);
						break;
				}
				tuples.forEach(area => {
					let omitIndices;
					switch (kind) {
						case 'rows': omitIndices = area.map(tuple => tuple.cell.props.col);
							break;
						case 'cols': omitIndices = area.map(tuple => tuple.cell.props.row);
							break;
						case 'blocks': omitIndices = area.map(tuple => [tuple.cell.props.row, tuple.cell.props.col]);
							break;
					}
					let tuple = area[0];
					tuple.members.forEach(member => {
						let data = {
							cell: tuple.cell,
							omit: omitIndices,
							value: member
						};
						switch (kind) {
							case 'rows': this._eventAggregator.publish('sweepRow', data);
								break;
							case 'cols': this._eventAggregator.publish('sweepCol', data);
								break;
							case 'blocks': this._eventAggregator.publish('sweepBlock', data);
								break;
						}

					});
				});
			});
		});
	}

	_processGrid() {
		this._processHandleId = setInterval(() => {
			if (this._doChecks > 0) {
				this._findUniques();
				this._findTuples();
				this._removeCheck();
				this._eventAggregator.publish('thinkingProgress', { progress: this._doChecks });
			}
			this._gridService.getStatus();
		}, 200);
	}

}
