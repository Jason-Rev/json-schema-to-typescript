
/// <reference path="../src/defs.d.ts"/>


import * as Rx from "rx";
import * as chai from "chai";
const { assert } = chai;

interface Item {
    name: string;
    value: number;
}

describe('test understanding of rxjs', ()=>{
    
    it('items being resolved in a radom order', ()=>{
        const subject = new Rx.Subject<string>();
        let isStopped = false;
        let started = 0;
        let completed = 0;

        function stopProcessing() {
            if (! isStopped) {
                console.log('Stopping!!');
                isStopped = true;
                subject.onCompleted();
            }
        }

        function fetch(name: string): Promise<Item> {
            return new Promise(resolve => {
                console.log(`Name: ${name}`);
                const start = Date.now();
                const delay = Math.floor(Math.random() * 50) + 1;
                started += 1; 
                setTimeout(()=>{
                    const stop = Date.now();
                    const probability = Math.random();
                    if (! isStopped && probability > 0.5) {
                        subject.onNext(name + name);
                    }
                    completed += 1;
                    resolve({ name, start, stop, delay });
                    if (probability < 0.1) {
                        stopProcessing();
                    }
                    if (! (started - completed)){
                        stopProcessing();
                    }
                    console.log(`Pending: ${started - completed}`);
                }, delay);        
            });
        }

        const promise = subject
            .map(fetch)
            .flatMap(x=>x)
            .tap(item => { console.log(item); })
            .toArray()
            .tap((a)=>{ console.log(`Started: ${started}, Completed: ${completed}, Elements: ${a.length}`); })
            .toPromise();    
            
        subject.onNext('z');
        const x = ['a', 'b', 'c', 'd'].forEach(value=>subject.onNext(value));
        return promise.then(()=>{
            assert.equal(started, completed);
        });
    });
    
});

