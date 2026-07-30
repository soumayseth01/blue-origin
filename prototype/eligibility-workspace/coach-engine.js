/* Grounded coach decision engine. This file is intentionally dependency-free so
   the same priority rules can be exercised in browser and contract tests. */
(function initializeBenefitConnectCoach(global) {
  "use strict";

  const ACTION_LABELS = {
    ask: "Ask for information",
    enter: "Enter confirmed information",
    review: "Review evidence",
    correct: "Correct the current entry",
    navigate: "Continue the workflow",
    validate: "Validate this screen",
    explain: "Review the authored result",
    close: "Complete call closure",
  };

  function hasValue(value) {
    return value !== "" && value !== null && value !== undefined && value !== false;
  }

  function policyFor(context, stageId) {
    const cards = context.policyPack?.cards || {};
    return cards[stageId] || cards.default || {
      summary: "Follow the approved demonstration workflow and preserve the source of each case fact.",
      scope: "Demonstration procedure",
      citation: "Integrated eligibility specification · Workflow contract",
      citations: [],
    };
  }

  function targetPayload(target, stageId) {
    if (!target) return { target_id: null, case_path: null, action_id: null, label: "Current workflow", stage_id: stageId };
    return {
      target_id: target.target_id || null,
      case_path: target.case_path || null,
      action_id: target.action_id || null,
      label: target.label || target.semantic_description || "Current workflow",
      stage_id: target.stage_id || stageId,
    };
  }

  function informationFor(target, disclosed) {
    const canReveal = disclosed || target?.safe_to_reveal;
    return {
      value: canReveal && hasValue(target?.expected_value) ? String(target.expected_value) : null,
      provenance: target?.provenance || (disclosed ? "Caller statement" : "Not yet disclosed"),
      disclosed: Boolean(disclosed),
      question: target?.question || null,
    };
  }

  function recommendation(context, actionType, target, copy = {}) {
    const stageId = target?.stage_id || context.stageId;
    const policy = policyFor(context, stageId);
    const disclosed = Boolean(target?.fact_disclosed);
    return {
      recommendation_id: `coach:${context.scenarioId || "demo"}:${stageId}:${actionType}:${target?.target_id || target?.case_path || target?.action_id || "workflow"}`,
      action_type: actionType,
      action_label: ACTION_LABELS[actionType] || ACTION_LABELS.navigate,
      title: copy.title || "Continue the current workflow",
      instruction: copy.instruction || "Complete the next grounded action shown in BenefitConnect.",
      target: targetPayload(target, stageId),
      information: informationFor(target, disclosed),
      policy: {
        summary: policy.summary,
        scope: policy.scope,
        citation: policy.citation,
        citations: Array.isArray(policy.citations) ? policy.citations : [],
      },
      source: "deterministic",
    };
  }

  function firstIncomplete(targets) {
    return (targets || []).find((target) => !hasValue(target.value));
  }

  function recommend(context) {
    const targets = context.targets || [];
    const stageId = context.stageId;

    // Evidence is a hard prerequisite once the learner reaches result review.
    if (["eligibility", "notices", "authorization"].includes(stageId) && !context.evidenceReviewed) {
      const target = context.evidenceTarget || { target_id: "evidence-wage-review", label: "Current wage statement", stage_id: "evidence", provenance: "Document" };
      return recommendation(context, "review", target, {
        title: "Review the outstanding wage evidence",
        instruction: "Open the wage record and confirm what fact it supports before reviewing an eligibility result.",
      });
    }

    // A fact must be disclosed before the coach reveals an applicant-supplied value.
    const undisclosed = targets.find((target) => !hasValue(target.value) && target.fact_id && !target.fact_disclosed);
    if (undisclosed) {
      return recommendation(context, "ask", undisclosed, {
        title: undisclosed.question || `Ask about ${String(undisclosed.label || "the missing fact").toLowerCase()}`,
        instruction: "Ask the caller one clear question. The coach will identify the value and destination after the fact is disclosed.",
      });
    }

    const disclosedMissing = targets.find((target) => !hasValue(target.value) && target.fact_id && target.fact_disclosed);
    if (disclosedMissing) {
      const value = hasValue(disclosedMissing.expected_value) ? `“${disclosedMissing.expected_value}”` : "the confirmed response";
      return recommendation(context, "enter", disclosedMissing, {
        title: `Enter ${value} in ${disclosedMissing.label}`,
        instruction: `Use the ${String(disclosedMissing.provenance || "caller statement").toLowerCase()} and enter the confirmed value in the mapped field.`,
      });
    }

    if (stageId === "evidence" && !context.evidenceReviewed) {
      const target = context.evidenceTarget || firstIncomplete(targets);
      return recommendation(context, "review", target, {
        title: "Review the current wage statement",
        instruction: "Confirm the person, program, fact supported, and any discrepancy before marking the evidence reviewed.",
      });
    }

    const failed = (context.validationFailures || []).find((item) => item.stage_id === stageId || !item.stage_id);
    if (failed && context.mode === "practice") {
      const target = targets.find((item) => item.target_id === failed.target_id || item.case_path === failed.case_path) || failed;
      return recommendation(context, "correct", target, {
        title: `Correct ${target.label || "the current entry"}`,
        instruction: "Compare the entry with the disclosed fact or supporting evidence, then validate the screen again.",
      });
    }

    if (stageId === "eligibility") {
      const runReason = targets.find((target) => target.target_id === "eligibility-run-reason");
      if (runReason && !hasValue(runReason.value)) {
        return recommendation(context, "enter", runReason, {
          title: "Select the eligibility run reason",
          instruction: "Choose the workflow reason that matches this synthetic case before loading the authored result.",
        });
      }
      if (["unrun", "stale"].includes(context.mockEligibilityStatus)) {
        const runTarget = { action_id: "run-mock-eligibility", label: "Run mock eligibility", stage_id: "eligibility", provenance: "Authored training fixture", safe_to_reveal: true };
        return recommendation(context, "explain", runTarget, {
          title: context.mockEligibilityStatus === "stale" ? "Reload the authored eligibility fixture" : "Load the authored eligibility fixture",
          instruction: "Run mock eligibility to load the scenario-authored result. AI does not calculate or change the outcome.",
        });
      }
    }

    const incomplete = firstIncomplete(targets);
    if (incomplete) {
      const value = incomplete.safe_to_reveal && hasValue(incomplete.expected_value) ? `“${incomplete.expected_value}”` : "the supported value";
      return recommendation(context, "enter", incomplete, {
        title: `Complete ${incomplete.label}`,
        instruction: `Review ${String(incomplete.provenance || "the approved source").toLowerCase()} and enter ${value} in the mapped field.`,
      });
    }

    if (!context.currentStageValidated) {
      return recommendation(context, "validate", { action_id: "validate-screen", label: "Validate and continue", stage_id: stageId, provenance: "Deterministic evaluator", safe_to_reveal: true }, {
        title: `Validate the completed ${context.stageLabel || stageId} screen`,
        instruction: "Run the deterministic screen check before continuing to the next workflow stage.",
      });
    }

    if (stageId === "authorization" && !context.callEnded) {
      return recommendation(context, "close", { action_id: "end-call", label: "End call", stage_id: stageId, provenance: "Call closure procedure", safe_to_reveal: true }, {
        title: "Summarize the result and close the call",
        instruction: "Explain pending items and next steps, invite final questions, then end the simulated call.",
      });
    }

    const nextStage = context.nextStage;
    if (nextStage) {
      const target = { ...(context.nextStageTarget || {}), stage_id: nextStage.id, label: context.nextStageTarget?.label || nextStage.label, safe_to_reveal: true };
      return recommendation(context, "navigate", target, {
        title: `Continue to ${nextStage.label}`,
        instruction: `The current screen is complete. Open ${nextStage.label} to continue the grounded workflow.`,
      });
    }

    return recommendation(context, "close", { action_id: "submit-attempt", label: "Submit prototype result", stage_id, provenance: "Demonstration procedure", safe_to_reveal: true }, {
      title: "Submit the completed simulation",
      instruction: "All mapped actions are complete. Submit to freeze the attempt and prepare feedback.",
    });
  }

  function cacheKey(context) {
    return JSON.stringify({
      scenarioId: context.scenarioId,
      stageId: context.stageId,
      mode: context.mode,
      targets: (context.targets || []).map((target) => [target.target_id, target.case_path, target.value, target.fact_disclosed]),
      evidenceReviewed: context.evidenceReviewed,
      mockEligibilityStatus: context.mockEligibilityStatus,
      currentStageValidated: context.currentStageValidated,
      validationFailures: context.validationFailures,
      callEnded: context.callEnded,
    });
  }

  global.BenefitConnectCoach = { recommend, cacheKey, hasValue };
})(typeof window !== "undefined" ? window : globalThis);
