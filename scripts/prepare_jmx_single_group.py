#!/usr/bin/env python3
"""Create a JMX copy where only one Thread Group is enabled."""

from __future__ import annotations

import argparse
import xml.etree.ElementTree as ET


def parse_args() -> argparse.Namespace:
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
    args = parse_args()

    tree = ET.parse(args.input)
    root = tree.getroot()

    target_id = args.thread_group_id.strip()
    matched = 0

    for element in root.iter():
        if element.tag != "ThreadGroup":
            continue

        if element.attrib.get("testclass") != "ThreadGroup":
            continue

        test_name = element.attrib.get("testname", "")
        is_target = test_name.startswith(f"{target_id} ")

        element.set("enabled", "true" if is_target else "false")
        if is_target:
            matched += 1

    if matched != 1:
        raise SystemExit(
            f"Expected exactly one ThreadGroup match for '{target_id}', found {matched}."
        )

    tree.write(args.output, encoding="UTF-8", xml_declaration=True)
    print(f"Generated {args.output} with only {target_id} enabled.")
    return 0


if __name__ == "__main__":
    raise SystemExit(main())
