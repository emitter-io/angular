import {Component, OnDestroy} from '@angular/core';
import {NgEmitter} from 'ng-emitter-io';
import {Subscription} from 'rxjs';
import {mergeMap} from 'rxjs/operators';

@Component({
    selector: 'app-root',
    template: `
        <pre>{{ status }}</pre>
    `,
    styleUrls: ['./app.component.css']
})
export class AppComponent implements OnDestroy {

    public status: string;
    private subscription: Subscription;

    constructor(private emitter: NgEmitter) {
        this.status = 'Connecting...';
        this.subscription = this.emitter
            .connect()
            .pipe(
                mergeMap(() => {
                    this.status += '\nConnected!';
                    this.status += '\nLooking me up...';
                    this.emitter.me();
                    return this.emitter.onMe();
                }),
                mergeMap(me => {
                    this.status += '\nConnected as username ' + me.username + ' with id ' + me.id + '!';
                    this.status += '\nDisconnecting...';
                    this.emitter.disconnect();
                    return this.emitter.onDisconnect();
                })
            )
            .subscribe(
                () => {
                    this.status += '\nDisconnected!';
                },
                err => {
                    this.status += '\nError: ' + err;
                });
    }

    public ngOnDestroy(): void {
        if (this.subscription) {
            this.subscription.unsubscribe();
            this.subscription = null;
        }
    }
}
