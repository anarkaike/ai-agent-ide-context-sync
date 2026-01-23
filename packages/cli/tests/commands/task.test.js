const fs = require('fs');
const path = require('path');
const task = require('../../cli/commands/task');
const { formatDate, slugify, getNextId, ensureDirs, start, list, complete, status } = task;

jest.mock('fs');

describe('Task Command', () => {
    let consoleLogSpy;
    const wsPath = '/mock/project/.ai-workspace';
    const activeDir = path.join(wsPath, 'tasks', 'active');
    const completedDir = path.join(wsPath, 'tasks', 'completed');

    beforeEach(() => {
        jest.clearAllMocks();
        consoleLogSpy = jest.spyOn(console, 'log').mockImplementation();
        fs.existsSync.mockReturnValue(true);
        fs.readdirSync.mockReturnValue([]);
        fs.mkdirSync.mockImplementation();
        fs.writeFileSync.mockImplementation();
        fs.readFileSync.mockReturnValue('');
        fs.unlinkSync.mockImplementation();
        jest.spyOn(process, 'cwd').mockReturnValue('/mock/project');
    });

    afterEach(() => {
        consoleLogSpy.mockRestore();
    });

    describe('Helpers', () => {
        test('formatDate should return ISO string', () => {
            const date = formatDate();
            expect(date).toMatch(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/);
        });

        test('slugify should format string correctly', () => {
            expect(slugify('Test Task')).toBe('test-task');
            expect(slugify('Test  Task')).toBe('test-task');
            expect(slugify('Test Task!')).toBe('test-task');
            expect(slugify('  Test Task  ')).toBe('test-task');
        });

        test('getNextId should return next sequential ID', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readdirSync.mockImplementation((dir) => {
                if (dir === activeDir) return ['task-001.md'];
                if (dir === completedDir) return ['task-002.md'];
                return [];
            });
            expect(getNextId(activeDir, completedDir)).toBe('003');
        });

        test('getNextId should return 001 if no files', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readdirSync.mockReturnValue([]);
            const id = getNextId(activeDir, completedDir);
            expect(id).toBe('001');
        });

        test('getNextId should return empty if directory does not exist', () => {
             fs.existsSync.mockImplementation((p) => p !== activeDir && p !== completedDir);
             // Since ensureDirs is not called here, we can test the helper directly
             // But getNextId calls getNumbers which calls fs.existsSync
             // We need to mock fs.existsSync to return false for the directories
             fs.existsSync.mockReturnValue(false);
             const id = getNextId(activeDir, completedDir);
             expect(id).toBe('001');
        });

        test('getNextId should handle files with invalid format', () => {
            fs.existsSync.mockReturnValue(true);
            fs.readdirSync.mockReturnValue(['task-invalid.md', 'task-001.md']);
            const id = getNextId(activeDir, completedDir);
            expect(id).toBe('002');
        });

        test('ensureDirs should create directories if not exist', () => {
            fs.existsSync.mockReturnValue(false);
            const dirs = ensureDirs(wsPath);
            expect(fs.mkdirSync).toHaveBeenCalledTimes(2);
            expect(dirs.activeDir).toBe(activeDir);
            expect(dirs.completedDir).toBe(completedDir);
        });

        test('complete should add completed_at if missing', async () => {
             fs.existsSync.mockReturnValue(true);
             fs.readdirSync.mockReturnValue(['task-001.md']);
             fs.readFileSync.mockReturnValue('status: in_progress\ncreated_at: 2024-01-01');
             
             await complete(['001'], wsPath);
             
             expect(fs.writeFileSync).toHaveBeenCalledWith(
                 expect.any(String),
                 expect.stringContaining('completed_at:'),
                 'utf-8'
             );
        });

        test('complete should NOT add completed_at if present', async () => {
             fs.existsSync.mockReturnValue(true);
             fs.readdirSync.mockReturnValue(['task-001.md']);
             fs.readFileSync.mockReturnValue('status: in_progress\ncompleted_at: 2024-01-02');
             
             await complete(['001'], wsPath);
             
             expect(fs.writeFileSync).toHaveBeenCalledWith(
                 expect.any(String),
                 expect.not.stringMatching(/completed_at:.*completed_at:/s), // Should not appear twice
                 'utf-8'
             );
        });
    });

    describe('Start Command', () => {
        test('should create new task', async () => {
            fs.readdirSync.mockReturnValue([]);
            await start(['My', 'Task'], wsPath);
            expect(fs.writeFileSync).toHaveBeenCalledWith(
                expect.stringContaining('task-001-my-task.md'),
                expect.stringContaining('title: My Task'),
                'utf-8'
            );
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Task iniciada'));
        });

        test('should warn if no title provided', async () => {
            await start([], wsPath);
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Informe o título'));
            expect(fs.writeFileSync).not.toHaveBeenCalled();
        });
    });

    describe('List Command', () => {
        test('should list active tasks', async () => {
            fs.readdirSync.mockReturnValue(['task-001.md']);
            fs.readFileSync.mockReturnValue(`---
id: task-001
title: Test Task
---
`);
            await list(wsPath);
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[task-001] Test Task'));
        });

        test('should handle empty list', async () => {
            fs.readdirSync.mockReturnValue([]);
            await list(wsPath);
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Nenhuma task ativa'));
        });

        test('should handle files without frontmatter', async () => {
             fs.readdirSync.mockReturnValue(['note.md']);
             fs.readFileSync.mockReturnValue('# Just a note');
             await list(wsPath);
             expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('note.md (sem frontmatter)'));
        });
    });

    describe('Complete Command', () => {
        test('should complete specific task by ID', async () => {
            fs.readdirSync.mockReturnValue(['task-001.md', 'task-002.md']);
            fs.readFileSync.mockReturnValue(`---
id: task-001
title: Task 1
status: in_progress
created_at: 2023-01-01
---`);
            
            await complete(['001'], wsPath);
            
            expect(fs.writeFileSync).toHaveBeenCalledWith(
                expect.stringContaining(path.join('completed', 'task-001.md')),
                expect.stringContaining('status: completed'),
                'utf-8'
            );
            expect(fs.unlinkSync).toHaveBeenCalledWith(expect.stringContaining(path.join('active', 'task-001.md')));
        });

        test('should complete single active task if no ID provided', async () => {
            fs.readdirSync.mockReturnValue(['task-001.md']);
            fs.readFileSync.mockReturnValue(`---
id: task-001
title: Task 1
status: in_progress
created_at: 2023-01-01
---`);
            await complete([], wsPath);
            expect(fs.writeFileSync).toHaveBeenCalled();
            expect(fs.unlinkSync).toHaveBeenCalled();
        });

        test('should warn if multiple tasks and no ID provided', async () => {
            fs.readdirSync.mockReturnValue(['task-001.md', 'task-002.md']);
            fs.readFileSync.mockReturnValue('---'); // Mock for list call inside complete
            await complete([], wsPath);
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Múltiplas tasks ativas'));
            expect(fs.writeFileSync).not.toHaveBeenCalled();
        });

        test('should warn if no active tasks to complete', async () => {
             fs.readdirSync.mockReturnValue([]);
             await complete([], wsPath);
             expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Nenhuma task ativa'));
        });

        test('should warn if task not found', async () => {
            fs.readdirSync.mockReturnValue(['task-001.md']);
            await complete(['999'], wsPath);
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Task não encontrada'));
        });
    });

    describe('Status Command', () => {
        test('should call list', async () => {
            const listSpy = jest.spyOn(task, 'list').mockImplementation();
            // Note: Since we are calling status directly from the exported object, 
            // and status calls list from the module scope (not this.list), 
            // mocking task.list might not work if status calls the internal list function.
            // However, in the updated task.js, I exported 'list'.
            // But 'status' function inside task.js calls 'list(wsPath)' directly, which refers to the const list defined in the file.
            // So spying on exported 'list' won't affect the internal call.
            // We can just verify it prints output similar to list.
            
            fs.readdirSync.mockReturnValue(['task-001.md']);
            fs.readFileSync.mockReturnValue(`---
id: task-001
title: Status Task
---`);
            await status(wsPath);
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('[task-001] Status Task'));
            listSpy.mockRestore();
        });
    });

    describe('Main Execution', () => {
        test('should handle missing workspace', async () => {
            fs.existsSync.mockReturnValue(false);
            await task(['list']);
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Workspace não encontrado'));
        });

        test('should route to start', async () => {
            await task(['start', 'Task']);
            expect(fs.writeFileSync).toHaveBeenCalled();
        });

        test('should route to list', async () => {
             await task(['list']);
             expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Nenhuma task'));
        });

         test('should route to complete', async () => {
             fs.readdirSync.mockReturnValue(['task-001.md']);
             fs.readFileSync.mockReturnValue('---\nid: task-001\n---');
             await task(['complete', '001']);
             expect(fs.writeFileSync).toHaveBeenCalled();
        });

        test('should route to status', async () => {
             await task(['status']);
             expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Nenhuma task'));
        });

        test('should show help for unknown command', async () => {
            await task(['unknown']);
            expect(consoleLogSpy).toHaveBeenCalledWith(expect.stringContaining('Gerenciador de Tasks'));
        });
    });
});
