const assert = require('assert');
const sinon = require('sinon');
const proxyquire = require('proxyquire').noCallThru();
const path = require('path');

describe('AIClient Unit Tests', () => {
    let AIClient;
    let execFileStub;
    let fsStub;
    let vscodeStub;
    let client;

    beforeEach(() => {
        execFileStub = sinon.stub();
        fsStub = {
            existsSync: sinon.stub().returns(true)
        };
        vscodeStub = {
            workspace: {
                rootPath: '/mock/root'
            }
        };

        AIClient = proxyquire('../../ai-client', {
            'child_process': { execFile: execFileStub },
            'fs': fsStub,
            'vscode': vscodeStub
        });

        client = new AIClient('/mock/root');
    });

    afterEach(() => {
        sinon.restore();
    });

    it('should initialize with project root', () => {
        assert.strictEqual(client.projectRoot, '/mock/root');
    });

    it('should fallback to vscode.workspace.rootPath if no root provided', () => {
        client = new AIClient();
        assert.strictEqual(client.projectRoot, '/mock/root');
    });

    it('should execute command successfully', async () => {
        execFileStub.yields(null, 'success output', '');
        const result = await client.execute(['test']);
        assert.strictEqual(result, 'success output');
        assert.ok(execFileStub.calledOnce);
    });

    it('should handle execution error', async () => {
        execFileStub.yields(new Error('Command failed'), '', 'error output');
        try {
            await client.execute(['test']);
            assert.fail('Should have thrown error');
        } catch (e) {
            assert.strictEqual(e, 'error output');
        }
    });

    it('should generate prompt correctly', async () => {
        execFileStub.yields(null, '=== 🤖 PROMPT GERADO ===\nMock Prompt Content', '');
        const result = await client.generatePrompt('my goal');
        assert.strictEqual(result, 'Mock Prompt Content');
    });

    it('should return raw output if prompt marker not found', async () => {
        execFileStub.yields(null, 'Raw Output', '');
        const result = await client.generatePrompt('my goal');
        assert.strictEqual(result, 'Raw Output');
    });

    it('should throw error if goal is missing for prompt', async () => {
        try {
            await client.generatePrompt();
            assert.fail('Should have thrown');
        } catch (e) {
            assert.strictEqual(e.message, 'Goal is required');
        }
    });

    it('should list workflows', async () => {
        execFileStub.yields(null, 'workflow list', '');
        await client.listWorkflows();
        assert.ok(execFileStub.calledWith(sinon.match.string, sinon.match.array.contains(['run'])));
    });

    it('should handle list workflows error', async () => {
        execFileStub.yields(new Error('fail'), '', '');
        const result = await client.listWorkflows();
        assert.deepStrictEqual(result, []);
    });

    it('should run workflow with params', async () => {
        execFileStub.yields(null, 'done', '');
        await client.runWorkflow('wf-id', { p1: 'v1' });
        const args = execFileStub.firstCall.args[1];
        assert.ok(args.includes('p1=v1'));
    });

    it('should scan docs', async () => {
        execFileStub.yields(null, 'scanned', '');
        await client.scanDocs('src');
        const args = execFileStub.firstCall.args[1];
        assert.ok(args.includes('scan'));
        assert.ok(args.includes('src'));
    });

    it('should run ritual', async () => {
        execFileStub.yields(null, 'ritual done', '');
        await client.runRitual();
        const args = execFileStub.firstCall.args[1];
        assert.ok(args.includes('ritual'));
    });

    it('should evolve rules', async () => {
        execFileStub.yields(null, 'evolved', '');
        await client.evolveRules();
        const args = execFileStub.firstCall.args[1];
        assert.ok(args.includes('rules'));
        assert.ok(args.includes('--evolve'));
    });

    it('should list rules', async () => {
        execFileStub.yields(null, 'rules list', '');
        await client.listRules();
        const args = execFileStub.firstCall.args[1];
        assert.ok(args.includes('rules'));
        assert.ok(args.includes('--list'));
    });

    it('should get kernel status', async () => {
        execFileStub.yields(null, 'kernel status', '');
        await client.getKernelStatus();
        const args = execFileStub.firstCall.args[1];
        assert.ok(args.includes('kernel'));
    });

    it('should init workspace', async () => {
        execFileStub.yields(null, 'init done', '');
        await client.initWorkspace();
        const args = execFileStub.firstCall.args[1];
        assert.ok(args.includes('init'));
    });

    it('should build context', async () => {
        execFileStub.yields(null, 'build done', '');
        await client.buildContext();
        const args = execFileStub.firstCall.args[1];
        assert.ok(args.includes('build'));
    });

    it('should get status', async () => {
        execFileStub.yields(null, 'status done', '');
        await client.getStatus();
        const args = execFileStub.firstCall.args[1];
        assert.ok(args.includes('status'));
    });

    it('should create identity', async () => {
        execFileStub.yields(null, 'identity created', '');
        await client.createIdentity('MyPersona');
        const args = execFileStub.firstCall.args[1];
        assert.ok(args.includes('identity'));
        assert.ok(args.includes('create'));
        assert.ok(args.includes('MyPersona'));
    });

    it('should list heuristics', async () => {
        execFileStub.yields(null, 'heuristics list', '');
        await client.listHeuristics();
        const args = execFileStub.firstCall.args[1];
        assert.ok(args.includes('heuristics'));
    });
});
