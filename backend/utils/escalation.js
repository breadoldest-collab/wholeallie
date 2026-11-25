/**
 * Shared Escalation Detection Helpers
 * Ensures consistent escalation detection across live chat, conversation listing,
 * and analytics without wiping persisted escalation flags.
 */

const ESCALATION_USER_REGEX = /\b(?:escalat\w*|escalt\w*|escate\w*|esclat\w*)\b|(?:talk to|speak (?:with|to)|connect (?:me )?(?:to|with)|transfer (?:me )?to|hand ?off to|pass (?:me )?to|forward (?:this )?to|get me|need|want)\s+(?:a\s+|an\s+|the\s+|your\s+)?(?:human|agent|person|representative|support rep|real person|manager|supervisor|staff|team|someone)|\b(?:live agent|human agent|human support|human team|customer service rep(?:resentative)?|speak to human|talk to human|real human|real agent|human help|staff member|support team)\b/i;

const CRITICAL_ISSUE_REGEX = /(?:\bhacked\b|security breach|credit card fraud|\boutage\b|chargeback|\blawyer\b|\bsue you\b|\bemergency\b|\bfraud\b|unauthorized charge|stolen account|compromised)/i;

const ESCALATION_AI_REPLY_REGEX = /(?:flagged with high priority|human representative will be in touch|connecting you with a human agent|touch with you shortly|escalated (?:your|this|the) (?:request|case|issue|ticket|chat|conversation)|already escalated|human team member|follow up with you shortly|on the case|reviewing your case|transferring you to (?:our|a) (?:support|human)|forwarded to our team|marked as priority)/i;

const PURE_ESCALATION_COMMAND_REGEX = /^\s*(?:please\s+)?(?:just\s+)?(?:escalat\w*|escalt\w*|escate\w*|esclat\w*)(?:\s+(?:this|it|now|please|to (?:a )?(?:human|agent|support|team|staff|manager)))?[\s!.?]*$|^\s*(?:please\s+)?(?:talk to|speak (?:with|to)|connect (?:me )?(?:to|with)|transfer (?:me )?to|get me)\s+(?:a\s+)?(?:human|agent|person|representative|support rep|real person|manager|support team|staff)[\s!.?]*$/i;

function isEscalationRequestedByUser(text = '') {
  if (!text || typeof text !== 'string') return false;
  return ESCALATION_USER_REGEX.test(text);
}

function isCriticalIssueMessage(text = '') {
  if (!text || typeof text !== 'string') return false;
  return CRITICAL_ISSUE_REGEX.test(text);
}

function isEscalationConfirmedByAi(text = '') {
  if (!text || typeof text !== 'string') return false;
  return ESCALATION_AI_REPLY_REGEX.test(text);
}

function isPureEscalationCommand(text = '') {
  if (!text || typeof text !== 'string') return false;
  return PURE_ESCALATION_COMMAND_REGEX.test(text);
}

module.exports = {
  ESCALATION_USER_REGEX,
  CRITICAL_ISSUE_REGEX,
  ESCALATION_AI_REPLY_REGEX,
  isEscalationRequestedByUser,
  isCriticalIssueMessage,
  isEscalationConfirmedByAi,
  isPureEscalationCommand,
};
