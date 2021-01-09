import { EventAggregator } from 'aurelia-event-aggregator';
import { inject } from 'aurelia-framework';

@inject(EventAggregator)
export class GridService {

	constructor(eventAggregator) {
		this._eventAggregator = eventAggregator;
		this._candidates = [0, 1, 2, 3, 4, 5, 6, 7, 8];
		this._tuples = [[], [], [], [], [], []];
		this.candidatesRemoved = false;
		this._fillTuples();
		this.reset();
	}

	reset() {
		this._cellsReadyCount = 0;
		// provides structure for 1 row, 1 column or 1 area of 3 x 3 cells
		this._cells = this._candidates.map(cell => cell = {});
		this._cols = this._newGrid();
		this._rows = this._newGrid();
		this._blocks = this._newGrid();
		this._areaSets = {
			'rows': this._rows,
			'cols': this._cols,
			'blocks': this._blocks
		};
		this.candidatesRemoved = false;
	}

	setCandidateRemoved(value) {
		this.candidatesRemoved = value;
	}

	_newGrid() {
		// create empty 9 x 9 array of empty objects - for each cell one
		let cellsSets = this._candidates.map(row => row = this._cells.slice());
		return cellsSets;
	}

	_fillTuples() {
		// .map() gebruiken?
		this._candidates.forEach(val1 => {
			for (let i = val1 + 1; i < this._candidates.length; i++) {
				const val2 = this._candidates[i];
				this._tuples[2].push([val1, val2]);
				for (let j = i + 1; j < this._candidates.length; j++) {
					const val3 = this._candidates[j];
					this._tuples[3].push([val1, val2, val3]);
					for (let k = j + 1; k < this._candidates.length; k++) {
						const val4 = this._candidates[k];
						this._tuples[4].push([val1, val2, val3, val4]);
						for (let l = k + 1; l < this._candidates.length; l++) {
							const val5 = this._candidates[l];
							this._tuples[5].push([val1, val2, val3, val4, val5]);
						}
					}
				}
			}
		});
	}

	registerCell(cell) {
		this._cellsReadyCount++;
		const row = cell.props.row;
		const col = cell.props.col;
		const rowBlock = cell.props.rowBlock;
		const colBlock = cell.props.colBlock;
		const blockIndex = rowBlock * 3 + colBlock;
		const blockCellIndex = (row % 3) * 3 + (col % 3);
		this._blocks[blockIndex][blockCellIndex] = cell;
		this._rows[row][col] = cell;
		this._cols[col][row] = cell;
		if (this._cellsReadyCount % 81 == 0) {
			setTimeout(() => {
				this.getStatus();
			});
		}
	}

	_isSet(cell) {
		return (cell && cell.props && cell.props.value >= 0);
	}

	_hasNoCandidates(cell) {
		return cell && cell.props.value < 0 && cell.candidates && !cell.candidates.some(candidate => candidate >= 0);
	}

	_hasEqualValues(areaSet) {
		const hasEqualValues = areaSet.some(area => area.some((cell, i, area) => {
			if (cell.props.value < 0) return false;
			area.reverse();
			const i2 = area.map(cell => cell.props.value).indexOf(cell.props.value);
			area.reverse();
			return i + i2 < area.length - 1;
		}));
		return hasEqualValues;
	}

	_areaIsCorrect(area) {
		return area.reduce((accumulator, currentValue) =>
			accumulator + currentValue.props.value, 0
		) == 36;
	}

	_allAreasCorrect() {
		return Object.values(this._areaSets).
			every(areaSet => areaSet.
				every(area => this._areaIsCorrect(area)));
	}

	getStatus() {
		const flatRows = this._rows.flat();
		const cellsSetCount = flatRows.flat().filter(cell => this._isSet(cell)).length;
		let newStatus;
		const someCellHasNoCandidates = flatRows.some(cell => this._hasNoCandidates(cell));
		const someAreaHasEqualValues = Object.values(this._areaSets).some(areaSet => this._hasEqualValues(areaSet));
		if (someCellHasNoCandidates || someAreaHasEqualValues) {
			newStatus = 'error';
		} else {
			switch (cellsSetCount) {
				case 0: newStatus = 'empty'; break;
				case 1: newStatus = 'initial'; break;
				case 81: if (this._allAreasCorrect()) {
					newStatus = 'solved';
				} else {
					newStatus = 'error';
				}
					break;
				default:
			}
		}
		if (newStatus !== this.status) {
			this._eventAggregator.publish('statusChanged', newStatus);
		}
		this.status = newStatus;
	}

	findUniqueCandidates(cells) {
		const theCells = [];
		this._candidates.forEach(candidate => {
			let theCell;
			let candidateCount = 0;
			cells.forEach(cell => {
				if (cell && cell.candidates && cell.candidates.indexOf(candidate) >= 0) {
					candidateCount++;
					theCell = cell;
				}
			});
			// hier ook !isset(theCell.props.value) => newValue weg?
			if (theCell && !theCell.props.newValue && candidateCount == 1) {
				theCell.props.newValue = candidate;
				theCells.push(theCell);
			}
		});
		return theCells;
	}

	findUniqueAreaCandidates() {
		let cells = [];
		Object.values(this._areaSets).
			forEach(areaSet => areaSet.
				forEach(area => cells = cells.concat(this.findUniqueCandidates(area))));
		return cells;
	}

	_allCandidatesInTuple(cell, tuple) {
		const candidates = cell.candidates.filter(candidate => candidate >= 0);
		const hasCandidates = candidates.length > 0;
		if (!hasCandidates) {
			return false;
		}
		const allCandidatesInTuple = candidates.every(candidate => tuple.indexOf(candidate) >= 0);
		return allCandidatesInTuple;
	}

	findTuples(areaType, tupleSize) {
		const cells = this._areaSets[areaType];
		const tuples = [];

		this._tuples[tupleSize].forEach(tuple => {
			cells.forEach(area => {
				let cellsSetsWithTuples = [];
				area.forEach(cell => {
					if (this._allCandidatesInTuple(cell, tuple)) {
						cellsSetsWithTuples.push({ cell: cell, members: tuple });
					}
				});
				if (cellsSetsWithTuples.length == tupleSize) {
					tuples.push(cellsSetsWithTuples);
				}
			});
		});
		return tuples;
	}

	saveGrid() {
		let values = this._rows.flat().map(cell => cell.props.value);
		localStorage.setItem('sudoku-helper', JSON.stringify(values));
	}

	loadGrid() {
		let values = JSON.parse(localStorage.getItem('sudoku-helper'));
		const size = this._candidates.length;
		this._cellsReadyCount = 0;
		values.forEach((value, i) => {
			const col = i % size;
			const row = Math.floor(i / size);
			this._eventAggregator.publish('loadCell', {
				col: col,
				row: row,
				value: value
			});
		});
	}

}
