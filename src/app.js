import { inject } from 'aurelia-framework';
import { GridService } from 'resources/services/grid-service';
import { EventAggregator } from 'aurelia-event-aggregator';

@inject(GridService, EventAggregator)
export class App {
    constructor(gridService, eventAggregator) {
        this._gridService = gridService;
        this._eventAggregator = eventAggregator;
        this._statusColor = 'empty';
    }
    attached() {
        this._eventAggregator.subscribe('statusChanged', status => {
            setTimeout(() => {
                $('body').removeClass().addClass(status);
            });
        });
    }
}
