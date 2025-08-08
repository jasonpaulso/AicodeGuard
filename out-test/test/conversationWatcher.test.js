"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
const chai_1 = require("chai");
const sinon = __importStar(require("sinon"));
const fs = __importStar(require("fs"));
const os = __importStar(require("os"));
const vscode = __importStar(require("vscode"));
const ConversationWatcher_1 = require("../src/watchers/ConversationWatcher");
const ConversationAnalyzer_1 = require("../src/analyzers/ConversationAnalyzer");
const NotificationManager_1 = require("../src/managers/NotificationManager");
// Mock VS Code APIs
const mockOutputChannel = {
    appendLine: (msg) => { },
    show: () => { },
    dispose: () => { },
};
const mockWindow = {
    showWarningMessage: async (message, ...items) => items[0],
};
// Mock fs.watch
class MockFSWatcher extends fs.FSWatcher {
    constructor() {
        super();
        this._listeners = {};
    }
    on(event, listener) {
        if (!this._listeners[event]) {
            this._listeners[event] = [];
        }
        this._listeners[event].push(listener);
        return this;
    }
    trigger(event, ...args) {
        if (this._listeners[event]) {
            this._listeners[event].forEach(listener => listener(...args));
        }
    }
    close() {
        // Mock close
    }
}
describe('ConversationWatcher', () => {
    let watcher;
    let sandbox;
    let mockFsWatch;
    let mockReadFileSync;
    let mockExistsSync;
    let mockReaddirSync;
    let mockNotificationManager;
    let mockConversationAnalyzer;
    beforeEach(() => {
        sandbox = sinon.createSandbox();
        // Mock fs methods
        mockFsWatch = sandbox.stub(fs, 'watch').returns(new MockFSWatcher());
        mockReadFileSync = sandbox.stub(fs, 'readFileSync');
        mockExistsSync = sandbox.stub(fs, 'existsSync');
        mockReaddirSync = sandbox.stub(fs, 'readdirSync');
        // Mock NotificationManager
        mockNotificationManager = sandbox.stub(NotificationManager_1.NotificationManager.getInstance());
        sandbox.stub(NotificationManager_1.NotificationManager, 'getInstance').returns(mockNotificationManager);
        // Mock ConversationAnalyzer
        mockConversationAnalyzer = sandbox.stub(ConversationAnalyzer_1.ConversationAnalyzer.prototype);
        sandbox.stub(ConversationAnalyzer_1.ConversationAnalyzer.prototype, 'analyzeTodoBailoutPatterns').returns({
            severity: 'HIGH',
            bailoutPatterns: ['test pattern'],
            score: 30,
        });
        sandbox.stub(ConversationAnalyzer_1.ConversationAnalyzer.prototype, 'shouldTriggerIntervention').returns(true);
        // Mock vscode.window
        Object.defineProperty(vscode, 'window', {
            value: mockWindow,
            writable: true,
        });
        // Mock os.homedir
        sandbox.stub(os, 'homedir').returns('/mock/home');
        watcher = new ConversationWatcher_1.ConversationWatcher();
    });
    afterEach(() => {
        sandbox.restore();
    });
    it('should not start watching if projects directory does not exist', async () => {
        mockExistsSync.withArgs('/mock/home/Projects').returns(false);
        await watcher.startWatching();
        (0, chai_1.expect)(mockReaddirSync.called).to.be.false;
    });
    it('should find and watch existing TODO.claude.md files', async () => {
        mockExistsSync.withArgs('/mock/home/Projects').returns(true);
        mockReaddirSync.returns(['project1', 'project2']);
        mockExistsSync.withArgs('/mock/home/Projects/project1/TODO.claude.md').returns(true);
        mockExistsSync.withArgs('/mock/home/Projects/project2/TODO.claude.md').returns(false);
        await watcher.startWatching();
        (0, chai_1.expect)(mockFsWatch.calledOnceWith('/mock/home/Projects/project1/TODO.claude.md')).to.be.true;
    });
    it('should schedule analysis on file change', async () => {
        mockExistsSync.withArgs('/mock/home/Projects').returns(true);
        mockReaddirSync.returns(['project1']);
        mockExistsSync.withArgs('/mock/home/Projects/project1/TODO.claude.md').returns(true);
        mockReadFileSync.returns('initial content');
        const clock = sinon.useFakeTimers();
        await watcher.startWatching();
        const mockWatcher = mockFsWatch.firstCall.returnValue;
        mockWatcher.trigger('change');
        // Advance time to trigger analysis
        clock.tick(2000);
        (0, chai_1.expect)(mockReadFileSync.calledTwice).to.be.true; // Initial read + read after change
        (0, chai_1.expect)(mockConversationAnalyzer.analyzeTodoBailoutPatterns.calledOnce).to.be.true;
        clock.restore();
    });
    it('should trigger intervention if analysis is HIGH and can intervene', async () => {
        mockExistsSync.withArgs('/mock/home/Projects').returns(true);
        mockReaddirSync.returns(['project1']);
        mockExistsSync.withArgs('/mock/home/Projects/project1/TODO.claude.md').returns(true);
        mockReadFileSync.returns('new content with HIGH bailout');
        const clock = sinon.useFakeTimers();
        await watcher.startWatching();
        const mockWatcher = mockFsWatch.firstCall.returnValue;
        mockWatcher.trigger('change');
        clock.tick(2000);
        (0, chai_1.expect)(mockNotificationManager.queueNotification.calledOnce).to.be.true;
        (0, chai_1.expect)(mockWindow.showWarningMessage.calledOnce).to.be.true;
        clock.restore();
    });
    it('should not trigger intervention if within cooldown period', async () => {
        mockExistsSync.withArgs('/mock/home/Projects').returns(true);
        mockReaddirSync.returns(['project1']);
        mockExistsSync.withArgs('/mock/home/Projects/project1/TODO.claude.md').returns(true);
        mockReadFileSync.returns('new content with HIGH bailout');
        const clock = sinon.useFakeTimers();
        await watcher.startWatching();
        const mockWatcher = mockFsWatch.firstCall.returnValue;
        mockWatcher.trigger('change');
        clock.tick(2000); // First intervention
        mockWatcher.trigger('change');
        clock.tick(10000); // Within cooldown
        (0, chai_1.expect)(mockNotificationManager.queueNotification.calledOnce).to.be.true; // Only one intervention
        clock.restore();
    });
    it('should extract messages correctly', () => {
        const content = `# Project
## Message 1
Some text.
### Sub-message
- Item 1
- Item 2
## Message 2
1. Step 1
2. Step 2
`;
        mockReadFileSync.returns(content);
        // Temporarily override the private method for testing
        const extractMessages = watcher.extractMessages.bind(watcher);
        const messages = extractMessages(content);
        (0, chai_1.expect)(messages).to.have.lengthOf(8); // Project, Message 1, Some text, Sub-message, Item 1, Item 2, Message 2, Step 1, Step 2
        (0, chai_1.expect)(messages[0]).to.equal('# Project\n');
        (0, chai_1.expect)(messages[1]).to.equal('Message 1\nSome text.\n');
    });
    it('should dispose all resources', async () => {
        mockExistsSync.withArgs('/mock/home/Projects').returns(true);
        mockReaddirSync.returns(['project1']);
        mockExistsSync.withArgs('/mock/home/Projects/project1/TODO.claude.md').returns(true);
        mockReadFileSync.returns('initial content');
        await watcher.startWatching();
        const mockWatcherInstance = mockFsWatch.firstCall.returnValue;
        const closeSpy = sandbox.spy(mockWatcherInstance, 'close');
        watcher.dispose();
        (0, chai_1.expect)(closeSpy.calledOnce).to.be.true;
    });
});
//# sourceMappingURL=conversationWatcher.test.js.map