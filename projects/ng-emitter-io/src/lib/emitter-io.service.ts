import {Injectable, NgZone} from '@angular/core';
import {
    ConnectRequest,
    Emitter,
    EmitterMessage,
    KeyGenEvent,
    KeyGenRequest,
    MeEvent,
    PresenceEvent,
    PresenceRequest,
    PublishRequest,
    SubscribeRequest,
    UnsubscribeRequest
} from 'emitter-io';
import {Observable, Subject} from 'rxjs';

declare let emitter: Emitter;

const enum SubjectKey {
    Connect = 'connect',
    Disconnect = 'disconnect',
    Message = 'message',
    Offline = 'offline',
    Error = 'error',
    KeyGen = 'keygen',
    Presence = 'presence',
    Me = 'me'
}

@Injectable({
    providedIn: 'root'
})
export class NgEmitter {
    public connected: boolean;
    private emitter: any;
    private subjects: { [key: string]: Subject<any> } = {};
    private request: ConnectRequest;
    private waitingID: any;

    constructor(private ngZone: NgZone) {
    }

    /**
     * Connects to the emitter service.
     */
    public connect(request?: ConnectRequest): Observable<void> {
        this.request = request || {};
        this.ngZone.runOutsideAngular(() => this.waitForEmitterToLoad());
        return this._getSubject<void>(SubjectKey.Connect);
    }

    /**
     * Gets an observable for all connection events from the server.
     */
    public onConnect(): Observable<void> {
        return this._getSubject<void>(SubjectKey.Connect);
    }

    /**
     * Gets an observable for all connection events from the server.
     */
    public onOffline(): Observable<void> {
        return this._getSubject<void>(SubjectKey.Offline);
    }

    /**
     * Gets an observable for all connection events from the server.
     */
    public onError(): Observable<Error> {
        return this._getSubject<Error>(SubjectKey.Error);
    }

    /**
     * Disconnects the client.
     */
    public disconnect() {
        if (this.waitingID) {
            clearInterval(this.waitingID);
            this.waitingID = null;
        }
        if (this.emitter) {
            this.emitter.disconnect();
        }
        return this._getSubject<void>(SubjectKey.Disconnect);
    }

    /**
     * Gets an observable for all disconnection events from the server.
     */
    public onDisconnect(): Observable<void> {
        return this._getSubject<void>(SubjectKey.Disconnect);
    }

    /**
     * Publishes a message to the currently opened endpoint.
     */
    public publish(request: PublishRequest): NgEmitter {
        this.emitter.publish(request);
        return this;
    }

    /**
     * Gets an observable for all connection events from the server.
     */
    public onMessage(): Observable<EmitterMessage> {
        return this._getSubject<EmitterMessage>(SubjectKey.Message);
    }

    /**
     * Subscribes to a particular channel.
     */
    public subscribe(request: SubscribeRequest): NgEmitter {
        this.emitter.subscribe(request);
        return this;
    }

    /**
     * Unsubscribes from a particular channel.
     */
    public unsubscribe(request: UnsubscribeRequest): NgEmitter {
        this.emitter.unsubscribe(request);
        return this;
    }

    /**
     * Sends a key generation request to the server.
     */
    public keygen(request: KeyGenRequest): NgEmitter {
        this.emitter.keygen(request);
        return this;
    }

    /**
     * Gets an observable for all key generation events from the server.
     */
    public onKeyGen(): Observable<KeyGenEvent> {
        return this._getSubject<KeyGenEvent>(SubjectKey.KeyGen);
    }

    /**
     * Sends a presence request to the server.
     */
    public presence(request: PresenceRequest): NgEmitter {
        this.emitter.presence(request);
        return this;
    }

    /**
     * Gets an observable for all presence events from the server.
     */
    public onPresence(): Observable<PresenceEvent> {
        return this._getSubject<PresenceEvent>(SubjectKey.Presence);
    }

    /**
     * Request information about the connection to the server.
     */
    public me(): NgEmitter {
        this.emitter.me();
        return this;
    }

    /**
     * Gets an observable for all me events from the server.
     */
    public onMe(): Observable<MeEvent> {
        return this._getSubject<MeEvent>(SubjectKey.Me);
    }

    /*
       Utility.
       */

    private waitForEmitterToLoad() {
        this.waitingID = setInterval(
            () => {
                if (emitter) {
                    clearInterval(this.waitingID);
                    this.waitingID = null;
                    this.bindEmitter();
                }
            },
            100);
    }

    private bindEmitter() {
        this.emitter = emitter.connect(this.request);

        // Lifecycle.
        this.emitter.on('connect', () => {
            this.connected = true;
            this._nextSubject<void>(SubjectKey.Connect);
        });
        this.emitter.on('disconnect', () => {
            this.connected = false;
            this._nextSubject<void>(SubjectKey.Disconnect);
        });

        // Messages.
        this.emitter.on('keygen', message => {
            this._nextSubject<KeyGenEvent>(SubjectKey.KeyGen, message);
        });
        this.emitter.on('presence', message => {
            this._nextSubject<PresenceEvent>(SubjectKey.Presence, message);
        });
        this.emitter.on('me', message => {
            this._nextSubject<MeEvent>(SubjectKey.Me, message);
        });
        this.emitter.on('message', message => {
            this._nextSubject<EmitterMessage>(SubjectKey.Message, message);
        });

        // Exceptional states.
        this.emitter.on('error', error => {
            this._nextSubject<Error>(SubjectKey.Error, error);
        });
        this.emitter.on('offline', () => {
            this.connected = false;
            this._nextSubject<void>(SubjectKey.Offline);
        });
    }

    /**
     * Creates or retrieves a subject for the given key.
     */
    private _getSubject<T>(key: SubjectKey): Subject<T> {
        if (!this.subjects[key]) {
            this.subjects[key] = new Subject<T>();
        }
        return this.subjects[key];
    }

    /**
     * Retrieves the specified subject and invokes "next" on it with the optionally provided argument.
     */
    private _nextSubject<T>(key: SubjectKey, args?: T) {
        this.ngZone.run(() => {
            const subject = this._getSubject<T>(key);
            if (args !== null && args !== undefined) {
                subject.next(args);
            } else {
                subject.next();
            }
        });
    }

}
