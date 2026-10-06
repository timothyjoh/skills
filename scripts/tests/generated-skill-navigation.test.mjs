import { test } from 'node:test';
import assert from 'node:assert/strict';
import { mkdtempSync, mkdirSync, writeFileSync, rmSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';

for (const [kind, prefix] of [['channel', 'cts'], ['playlist', 'pts']]) {
  test(`${kind}: generated references must be directly discoverable and navigable`, t => {
    const dir = mkdtempSync(join(tmpdir(), 'skill-navigation-'));
    t.after(() => rmSync(dir, { recursive: true, force: true }));
    const skill = join(dir, 'skill with spaces');
    const kb = join(dir, 'kb');
    mkdirSync(join(skill, 'concepts'), { recursive: true });
    mkdirSync(kb);
    writeFileSync(join(kb, 'taxonomy.json'), JSON.stringify({ concepts: [{ id: 'one', video_ids: [] }] }));
    writeFileSync(join(kb, 'scope.json'), JSON.stringify({ playlist_id: 'PLfixture', chosen_cut: 'all', videos: [], entries: [] }));
    const supports = ['glossary', 'patterns', 'cheatsheet', 'sources'];
    for (const name of supports) writeFileSync(join(skill, `${name}.md`), `# ${name}\n`);
    writeFileSync(join(skill, 'concepts/one.md'), '# One\n## Sources\n[00:01] A fixture source.\n');
    const entry = '---\nname: fixture\ndescription: Fixture\n---\n# Fixture\n';
    const links = supports.map(n => `[${n}](./${n}.md#section)`).join('\n');
    writeFileSync(join(skill, 'SKILL.md'), `${entry}${links}\n`);
    const run = () => {
      const r = spawnSync(process.execPath, [resolve(`skills/knowledge/${kind}-to-skill/scripts/${prefix}_validate.js`), '--skill-dir', skill, '--kb-dir', kb, '--json'], { encoding: 'utf8' });
      assert.equal(r.stderr, '');
      return { status: r.status, ...JSON.parse(r.stdout) };
    };
    let report = run();
    assert.equal(report.status, 1);
    assert.ok(report.errors.some(e => e.startsWith('E7 concepts/one.md')));
    writeFileSync(join(skill, 'SKILL.md'), `${entry}${links}\n[One](./concepts/one.md#sources)\n`);
    assert.equal(run().status, 0);

    const longBody = `## First\n${'A useful rule.\n'.repeat(101)}\n## Last\nThe final rule.\n`;
    writeFileSync(join(skill, 'patterns.md'), `# Patterns\n${longBody}`);
    assert.ok(run().errors.some(e => e.startsWith('E8 patterns.md')));
    writeFileSync(join(skill, 'patterns.md'), `# Patterns\n## Contents\n- [First](#first)\n${longBody}`);
    assert.ok(run().errors.some(e => e.startsWith('E8 patterns.md')));
    writeFileSync(join(skill, 'patterns.md'), `# Patterns\n## Contents\n- [First](#first)\n- [Last](#last)\n${longBody}`);
    assert.equal(run().status, 0);
    writeFileSync(join(skill, 'patterns.md'), `# Patterns\n## Contents\n- [First](#wrong)\n- [Last](#last)\n${longBody}`);
    assert.ok(run().errors.some(e => e.startsWith('E8 patterns.md')));

    // A fake contents list inside a code example cannot satisfy navigation.
    writeFileSync(join(skill, 'patterns.md'), `# Patterns\n\`\`\`md\n## Contents\n- [First](#first)\n- [Last](#last)\n\`\`\`\n${longBody}`);
    assert.ok(run().errors.some(e => e.startsWith('E8 patterns.md')));
    writeFileSync(join(skill, 'patterns.md'), '# Patterns\nShort reference.\n');
    writeFileSync(join(skill, 'SKILL.md'), `${entry}${links}\n[One](concepts/one.md)\n${'x\n'.repeat(500)}`);
    assert.ok(run().errors.some(e => e.startsWith('E2')));
  });
}
