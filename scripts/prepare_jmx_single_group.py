#!/usr/bin/env python3
"""Create a JMX copy where only one Thread Group is enabled.

This helper is used by CI to run one load profile at a time by toggling
ThreadGroup `enabled` flags in the source JMX file.
"""

from __future__ import annotations

import argparse
import xml.etree.ElementTree as ET


def parse_args() -> argparse.Namespace:
    """Parse command-line arguments for source/target JMX files and group ID."""
    parser = argparse.ArgumentParser(
        description="Enable exactly one Thread Group by ID (for example: TG1, TG2)."
    )
    parser.add_argument("--input", required=True, help="Input JMX file path")
    parser.add_argument("--output", required=True, help="Output JMX file path")
    parser.add_argument(
        "--thread-group-id",
        required=True,
        help="Thread group ID prefix to enable (example: TG1)",
    )
    return parser.parse_args()


def main() -> int:
    # Read CLI input once and keep the rest of the function focused on XML edits.
    args = parse_args()

    # Parse the JMX XML document.
    tree = ET.parse(args.input)
    root = tree.getroot()

    # The expected prefix in Thread Group names, e.g. "TG1 " or "TG2 ".
    target_id = args.thread_group_id.strip()
    matched = 0

    # JMeter plans can contain many elements; only mutate real ThreadGroup nodes.
    for element in root.iter():
        if element.tag != "ThreadGroup":
            continue

        if element.attrib.get("testclass") != "ThreadGroup":
            continue

        test_name = element.attrib.get("testname", "")
        # Convention used in the JMX: testname starts with "TGx " for each group.
        is_target = test_name.startswith(f"{target_id} ")

        # Enable only the selected group and disable all others.
        element.set("enabled", "true" if is_target else "false")
        if is_target:
            matched += 1

    # Guardrail: fail fast if naming changed or if IDs are duplicated/missing.
    if matched != 1:
        raise SystemExit(
            f"Expected exactly one ThreadGroup match for '{target_id}', found {matched}."
        )

    # Persist a clean XML file that CI passes to JMeter.
    tree.write(args.output, encoding="UTF-8", xml_declaration=True)
    print(f"Generated {args.output} with only {target_id} enabled.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
