#!/usr/bin/env python3
import json
import re
import struct
import zipfile
import xml.etree.ElementTree as ET
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
WORKING = ROOT / "working"
ICON_MANIFEST = ROOT / "assets" / "icons" / "icon_manifest.json"
AI_DOC = ROOT / "docs" / "Yeeflow_AI_Agent_Template_Configuration_Catalog.docx"
COPILOT_DOC = ROOT / "docs" / "Yeeflow_Copilot_Template_Configuration_Catalog.docx"

NS = {"w": "http://schemas.openxmlformats.org/wordprocessingml/2006/main"}

AI_AGENT_NAMES = [
    "Supplier Review Agent",
    "Lead Qualification Agent",
    "Support Case Triage Agent",
    "Contract Review Agent",
    "Invoice Exception Agent",
    "Purchase Policy Check Agent",
    "HR Request Classification Agent",
    "Project Risk Briefing Agent",
    "Renewal Health Agent",
    "Compliance Evidence Agent",
    "KPI Anomaly Review Agent",
    "Executive Briefing Agent",
]

COPILOT_NAMES = [
    "Procurement Onboarding Copilot",
    "Sales Opportunity Copilot",
    "Support Resolution Copilot",
    "Contract Review Copilot",
    "Finance Operations Copilot",
    "Procurement Policy Copilot",
    "Employee HR Copilot",
    "PMO Copilot",
    "Customer Success Copilot",
    "Compliance Review Copilot",
    "Operations Insight Copilot",
    "Executive Operations Copilot",
]


def cell_text(element):
    return "".join(t.text or "" for t in element.findall(".//w:t", NS)).strip()


def parse_docx_blocks(path):
    with zipfile.ZipFile(path) as zf:
        root = ET.fromstring(zf.read("word/document.xml"))

    blocks = []
    body = root.find("w:body", NS)
    for child in body:
        tag = child.tag.split("}")[-1]
        if tag == "p":
            text = cell_text(child)
            if text:
                blocks.append({"type": "paragraph", "text": text})
        elif tag == "tbl":
            rows = []
            for tr in child.findall("w:tr", NS):
                row = []
                for tc in tr.findall("w:tc", NS):
                    paragraphs = [cell_text(p) for p in tc.findall("w:p", NS)]
                    row.append("\n".join(p for p in paragraphs if p))
                if any(row):
                    rows.append(row)
            blocks.append({"type": "table", "rows": rows})
    return blocks


def paragraph_index(blocks, numbered_name):
    for idx, block in enumerate(blocks):
        if block["type"] == "paragraph" and block["text"] == numbered_name:
            return idx
    raise ValueError(f"Could not find section heading: {numbered_name}")


def rows_to_key_values(rows):
    values = {}
    for row in rows[1:]:
        if len(row) >= 2:
            values[row[0].strip()] = row[1].strip()
    return values


def rows_to_variables(rows):
    variables = []
    for row in rows[1:]:
        if len(row) >= 3:
            variables.append({
                "name": row[0].strip(),
                "type": row[1].strip(),
                "short_description": row[2].strip(),
            })
    return variables


def rows_to_tool_calls(rows):
    tools = []
    for row in rows[1:]:
        if len(row) >= 2:
            tools.append({
                "title": row[0].strip(),
                "description": row[1].strip(),
            })
    return tools


def single_cell_body(rows, expected_title):
    if not rows or not rows[0]:
        return ""
    text = rows[0][0].strip()
    prefix = expected_title + "\n"
    if text.startswith(prefix):
        return text[len(prefix):].strip()
    if text == expected_title:
        return ""
    return text


def icon_map():
    entries = json.loads(ICON_MANIFEST.read_text(encoding="utf-8"))
    mapped = {}
    for item in entries:
        mapped.setdefault((item["template_type"], item["template_name"]), []).append(item)
    return mapped


def validate_icon(template_type, name, icons):
    matches = icons.get((template_type, name), [])
    issues = []
    if len(matches) != 1:
        issues.append(f"Expected exactly one matching icon, found {len(matches)}.")
        return None, issues

    icon = matches[0]
    path = ROOT / icon["folder_path"] / icon["filename"]
    if not path.exists():
        issues.append(f"Icon file does not exist: {path.relative_to(ROOT)}")
        return str(path.relative_to(ROOT)), issues

    data = path.read_bytes()
    width, height = struct.unpack(">II", data[16:24])
    if (width, height) != (64, 64):
        issues.append(f"Icon dimensions are {width}x{height}, expected 64x64.")
    if path.stat().st_size >= 50 * 1024:
        issues.append("Icon is 50 KB or larger.")
    if not icon.get("quality_checks_passed"):
        issues.append("Icon manifest quality_checks_passed is not true.")

    return str(path.relative_to(ROOT)), issues


def validation_status(template_type, name, icon_path, icon_issues, extracted_fields):
    issues = list(icon_issues)
    for field_name, value in extracted_fields.items():
        if value is None or value == "" or value == []:
            issues.append(f"Missing {field_name}.")

    return {
        "passed": not issues,
        "source_catalog_matched": True,
        "exactly_one_matching_icon": len(icon_issues) == 0 and bool(icon_path),
        "icon_file_exists": bool(icon_path and (ROOT / icon_path).exists()),
        "required_fields_present": not any(issue.startswith("Missing ") for issue in issues),
        "issues": issues,
    }


def parse_agents(blocks, icons):
    templates = []
    for number, name in enumerate(AI_AGENT_NAMES, 1):
        idx = paragraph_index(blocks, f"{number}. {name}")
        short_description = blocks[idx + 1]["text"]
        config = rows_to_key_values(blocks[idx + 2]["rows"])
        input_variables = rows_to_variables(blocks[idx + 4]["rows"])
        output_variables = rows_to_variables(blocks[idx + 6]["rows"])
        persona_prompt = single_cell_body(blocks[idx + 7]["rows"], "Persona & Prompt")
        tool_calls = rows_to_tool_calls(blocks[idx + 9]["rows"])
        icon_path, icon_issues = validate_icon("AI Agent", name, icons)

        fields = {
            "short_description": short_description,
            "icon_file_path": icon_path,
            "input_variables": input_variables,
            "output_variables": output_variables,
            "persona_and_prompt": persona_prompt,
            "tool_calls": tool_calls,
        }
        templates.append({
            "name": name,
            "short_description": config.get("Short description", short_description),
            "icon_file_path": icon_path,
            "input_variables": input_variables,
            "output_variables": output_variables,
            "persona_and_prompt": persona_prompt,
            "tool_calls": tool_calls,
            "validation_status": validation_status("AI Agent", name, icon_path, icon_issues, fields),
        })
    return templates


def parse_copilots(blocks, icons):
    templates = []
    for number, name in enumerate(COPILOT_NAMES, 1):
        idx = paragraph_index(blocks, f"{number}. {name}")
        short_description = blocks[idx + 1]["text"]
        config = rows_to_key_values(blocks[idx + 2]["rows"])
        instruction = single_cell_body(blocks[idx + 3]["rows"], "Instruction")
        tool_calls = rows_to_tool_calls(blocks[idx + 5]["rows"])
        icon_path, icon_issues = validate_icon("Copilot", name, icons)

        fields = {
            "short_description": short_description,
            "icon_file_path": icon_path,
            "instruction": instruction,
            "tool_calls": tool_calls,
        }
        templates.append({
            "name": name,
            "short_description": config.get("Short description", short_description),
            "icon_file_path": icon_path,
            "instruction": instruction,
            "tool_calls": tool_calls,
            "validation_status": validation_status("Copilot", name, icon_path, icon_issues, fields),
        })
    return templates


def build_manifest(template_type, source_doc, templates):
    return {
        "manifest_type": f"Yeeflow {template_type} template creation manifest",
        "source_documents": [
            str(source_doc.relative_to(ROOT)),
            str(ICON_MANIFEST.relative_to(ROOT)),
        ],
        "template_count": len(templates),
        "validation_summary": {
            "all_templates_present": len(templates) == 12,
            "all_templates_have_exactly_one_matching_icon": all(t["validation_status"]["exactly_one_matching_icon"] for t in templates),
            "all_required_fields_present": all(t["validation_status"]["required_fields_present"] for t in templates),
            "all_templates_passed": all(t["validation_status"]["passed"] for t in templates),
        },
        "templates": templates,
    }


def main():
    WORKING.mkdir(parents=True, exist_ok=True)
    icons = icon_map()
    agent_blocks = parse_docx_blocks(AI_DOC)
    copilot_blocks = parse_docx_blocks(COPILOT_DOC)

    agent_manifest = build_manifest("AI Agent", AI_DOC, parse_agents(agent_blocks, icons))
    copilot_manifest = build_manifest("Copilot", COPILOT_DOC, parse_copilots(copilot_blocks, icons))

    (WORKING / "final-ai-agent-creation-manifest.json").write_text(
        json.dumps(agent_manifest, indent=2),
        encoding="utf-8",
    )
    (WORKING / "final-copilot-creation-manifest.json").write_text(
        json.dumps(copilot_manifest, indent=2),
        encoding="utf-8",
    )

    print(json.dumps({
        "ai_agent_templates": agent_manifest["template_count"],
        "copilot_templates": copilot_manifest["template_count"],
        "ai_agent_all_passed": agent_manifest["validation_summary"]["all_templates_passed"],
        "copilot_all_passed": copilot_manifest["validation_summary"]["all_templates_passed"],
        "ai_agent_manifest": "working/final-ai-agent-creation-manifest.json",
        "copilot_manifest": "working/final-copilot-creation-manifest.json",
    }, indent=2))


if __name__ == "__main__":
    main()
