import {TestBed} from '@angular/core/testing';

import {NgEmitter} from './emitter-io.service';

describe('EmitterIoService', () => {
    beforeEach(() => TestBed.configureTestingModule({}));

    it('should be created', () => {
        const service: NgEmitter = TestBed.get(NgEmitter);
        expect(service).toBeTruthy();
    });
});
