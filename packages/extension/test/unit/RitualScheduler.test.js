const assert = require('assert');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();

describe('RitualScheduler Unit Tests', () => {
    let RitualScheduler;
    let vscodeStub;
    let aiClientStub;
    let i18nStub;
    let scheduler;
    let clock;
    let statusBarItemStub;

    beforeEach(() => {
        clock = sinon.useFakeTimers();
        
        statusBarItemStub = {
            show: sinon.stub(),
            hide: sinon.stub(),
            text: '',
            tooltip: '',
            command: ''
        };

        vscodeStub = {
            window: {
                createStatusBarItem: sinon.stub().returns(statusBarItemStub),
                showWarningMessage: sinon.stub().resolves()
            },
            StatusBarAlignment: { Left: 1 },
            commands: {
                executeCommand: sinon.stub().resolves()
            }
        };

        const aiClientInstanceStub = {
            evolveRules: sinon.stub().resolves('No drift')
        };

        // Stub the class constructor
        aiClientStub = sinon.stub().returns(aiClientInstanceStub);

        i18nStub = {
            t: sinon.stub().callsFake(key => key)
        };

        RitualScheduler = proxyquire('../../modules/RitualScheduler', {
            'vscode': vscodeStub,
            '../ai-client': aiClientStub
        });

        scheduler = new RitualScheduler({}, i18nStub, 1000);
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should initialize correctly', () => {
        assert.ok(scheduler.client);
        assert.ok(scheduler.statusBarItem);
        assert.strictEqual(scheduler.intervalMs, 1000);
    });

    it('should start monitoring', () => {
        scheduler.start();
        assert.ok(scheduler.timer);
        assert.ok(statusBarItemStub.show.calledOnce);
    });

    it('should not start if already running', () => {
        scheduler.start();
        const timer1 = scheduler.timer;
        scheduler.start();
        assert.strictEqual(scheduler.timer, timer1);
    });

    it('should stop monitoring', () => {
        scheduler.start();
        scheduler.stop();
        assert.strictEqual(scheduler.timer, null);
        assert.ok(statusBarItemStub.hide.calledOnce);
    });

    it('should run check on interval', async () => {
        scheduler.start();
        // Advance 60s for initial check
        await clock.tickAsync(60000);
        assert.ok(scheduler.client.evolveRules.called);
        
        scheduler.client.evolveRules.resetHistory();
        
        // Advance interval
        await clock.tickAsync(1000);
        assert.ok(scheduler.client.evolveRules.called);
    });

    it('should notify drift when detected', async () => {
        scheduler.client.evolveRules.resolves('Drift detectado: Critical');
        vscodeStub.window.showWarningMessage.resolves('ritualScheduler.runRitual');

        await scheduler.check();

        assert.ok(vscodeStub.window.showWarningMessage.called);
        assert.ok(vscodeStub.commands.executeCommand.calledWith('ai-agent-sync.ritual'));
    });

    it('should ignore drift if user cancels', async () => {
        scheduler.client.evolveRules.resolves('Drift detectado: Critical');
        vscodeStub.window.showWarningMessage.resolves('ritualScheduler.ignore');

        await scheduler.check();

        assert.ok(vscodeStub.window.showWarningMessage.called);
        assert.ok(vscodeStub.commands.executeCommand.notCalled);
    });

    it('should handle check errors gracefully', async () => {
        scheduler.client.evolveRules.rejects(new Error('Network error'));
        await scheduler.check();
        // Should not crash
    });
});
