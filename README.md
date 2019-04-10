[![NPM](https://nodei.co/npm/ng-emitter-io.png)](https://nodei.co/npm/ng-emitter-io/)
[![NPM](https://nodei.co/npm-dl/ng-emitter-io.png)](https://nodei.co/npm/ng-emitter-io/)

This repository contains an Angular client for [Emitter](https://emitter.io) (see also on [Emitter GitHub](https://github.com/emitter-io/emitter)). Emitter is an **open-source** real-time communication service for connecting online devices. At its core, emitter.io is a distributed, scalable and fault-tolerant publish-subscribe messaging platform based on MQTT protocol and featuring message storage.

* [Installation](#install)
* [Example](#example)
* [API](#api)
* [License](#license)

<a name="install"></a>
## Installation

Install this module and its dependency, the emitter-io JavaScript library:
```
npm install ng-emitter-io emitter-io --save
```

Then, include the JavaScript library in your `angular.json`'s `scripts` array:

```
{
  "$schema": "./node_modules/@angular/cli/lib/config/schema.json",
  ...
  "projects": {
    "YOUR PROJECT NAME WILL BE HERE": {
      "architect": {
        "build": {
          "options": {
            "scripts": [
              "node_modules/emitter-io/build/emitter.js"
            ]
            ...
```


<a name="example"></a>
## Example

In your own project, you'll want to import the service, connect (optionally providing connection options), and then use the various instance methods on the service. The API is identical to that of the JavaScript library, except instead of using callbacks, RXJS observables are returned. You can subscribe to these to get responses from the server.

The following is an example `app.component.ts` that demonstrates all of these key concepts by connecting, calling the `me()` method, and then disconnecting. You can also view the file in `src/app/app.component.ts` in this repository.

```typescript
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

```
<a name="api"></a>
## API

TODO: The API needs to be documented here.

The API of this service is equivalent to that of https://github.com/emitter-io/javascript with two main differences:

1. It assumes you have a single Emitter server, and it manages the connection for you once you call `emitter.connect()`. This allows you to quickly use the connection across your application without worrying about where to store the reference to the connection.
2. Instead of using callbacks, such as `client.on('event-name', function(args) {})`, observables are returned from the strongly typed `on*` methods. For example, `let subscription = emitter.onMe().subscribe(me => {})` would allow you to subscribe (and later unsubscribe) to all `me` events. Invoke `emitter.me()` and it will get called shortly! You can take advantage of piping and everything else RXJS has to offer. 

<a name="license"></a>
## License

The MIT License (MIT)
Copyright (c) 2016 Misakai Ltd.
