# Rules that apply to every card type

## 1. Two audiences, one card, in order

Developer sections first, QA sections second, split by a horizontal rule. Do not interleave. A tester scrolling for "Steps to Test" hits one boundary, not five.

## 2. STE-flavored English, through the skill

Every card body goes through the `asd-ste100` skill in STE-flavored mode. Structural rules in full, lexical rules advisory. See SKILL.md Step 4 for the list.

State findings flat. Hedge nowhere, then tag the one claim that is inference: `(inferred from code, not reproduced)`. Decide the claim before the STE pass. The rewriter preserves hedges and will not firm up soft prose for you. Do not let the rewrite invent a cause, a frequency or a mechanism.

## 3. Path and symbol, never line number

Line numbers drift with every commit. A card outlives the commit it was written against.

```text
Yes:  src/Billing/InvoiceService.cs → CloseInvoice()
No:   src/Billing/InvoiceService.cs:263
```

Paths are repo-relative. Name the class when the symbol alone is ambiguous. For a cron expression or SQL fragment with no symbol, quote the line itself.

## 4. Say each fact once

Summary states the finding. Root Cause proves it. Suggested Fix says what to do. One deliberate repetition only: the Summary fix bullets are restated in full in the fix section. The bullets are for a ten-second scan. The section is for argument.

## 5. Attribute machine analysis in the heading

The fix section is titled "Suggested Fix from Claude" on a bug and "Suggested Approach from Claude" on a story or task. The heading tells the developer this is a machine's reading, so they weigh it and own the call. Because the heading does that work, do not hedge inside the section. State the recommendation, the alternatives and the trade-off.

## 6. Generate alternatives independently

A second agent reviews the same evidence and proposes other fix paths. Present them with their trade-off, not as equals. Name the recommended one.

## 7. Tag QA steps that were derived, not observed

Steps that come from reading code are a hypothesis. Tag them `(derived from code, needs validation)`. A human validates and edits before pickup. An untagged step is a promise that someone saw it happen.

## 8. Every desired behaviour gets an acceptance criteria line or an Out of scope line

The failure this prevents: a story's Desired Behaviour named two integrations to switch off. Its acceptance criteria covered one. The second was never built, the card closed as Done, and the gap surfaced in production weeks later.

Walk the two sections against each other. Nothing appears in one and vanishes from the other. Out of scope is a real answer. Silence is not.

## 9. Write the contract down when the work changes one

When a card changes a shape that crosses a boundary, the card carries the shape in a fenced typed block. A token payload, an API request or response, a queue message, a cookie, a persisted record, an event. The trigger is the boundary, not the size.

The failure this prevents: five cards specified one optional claim on a single sign-on token, all in prose. Days in, the developer asked in a comment what the token format was and what the fields were called. None of the five cards could answer.

- TypeScript for a Node consumer, C# for a .NET one, JSON for a wire format with no owner.
- Say what absence means. `identity?:` is not a spec until the card says absent means anonymous, the issuer omits rather than sends null, and a blank is a validation failure.
- One block shared verbatim when two cards build the two ends. Each names the other.
- Bind it to an acceptance criteria line or a Done-when line. A block nothing tests against is documentation, and documentation drifts.

Place it after the evidence section and before the "from Claude" section. No contract, no section.

## 10. Pin the code state

Close every card with repo, branch, commit and date.

```text
Code as of `api` `main` @ `3f2a9c1` (2026-09-15).
```

## 11. Keep out-of-scope findings visible

Investigating one bug surfaces two more. Do not widen the card. Do not drop the findings. List them under "Worth noting, out of scope" with enough detail to raise a separate card, and raise it.
