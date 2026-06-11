#!/usr/bin/env python3
import json
import math
import os
import struct
import zlib
from pathlib import Path

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / "assets" / "icons"
AGENT_DIR = OUT / "ai-agents"
COPILOT_DIR = OUT / "copilots"
PREVIEW_DIR = OUT / "preview"

BLUE = (20, 111, 246, 255)
BLUE_DARK = (13, 76, 178, 255)
BLUE_SOFT = (232, 242, 255, 255)
PURPLE = (124, 77, 255, 255)
PURPLE_SOFT = (241, 236, 255, 255)
PINK = (232, 94, 207, 255)
INK = (51, 51, 51, 255)
SLATE = (95, 110, 132, 255)
BORDER = (215, 228, 248, 255)
WHITE = (255, 255, 255, 255)
BG = (247, 250, 255, 255)

AGENTS = [
    ("Supplier Review Agent", "supplier-review-agent.png", "document + shield/check", "supplier onboarding review, compliance validation, missing information check", "supplier"),
    ("Lead Qualification Agent", "lead-qualification-agent.png", "target + person/business card", "sales lead scoring, qualification, business fit", "lead"),
    ("Support Case Triage Agent", "support-case-triage-agent.png", "headset + routing arrows or alert triage", "support classification, severity, routing", "support"),
    ("Contract Review Agent", "contract-review-agent.png", "document + magnifier", "contract analysis, clause review, document extraction", "contract"),
    ("Invoice Exception Agent", "invoice-exception-agent.png", "invoice/document + warning marker", "finance exception detection, mismatch review", "invoice"),
    ("Purchase Policy Check Agent", "purchase-policy-check-agent.png", "checklist/document + policy check", "purchase compliance and policy validation", "policy"),
    ("HR Request Classification Agent", "hr-request-classification-agent.png", "person/profile + branch/tag", "employee request classification and routing", "hr"),
    ("Project Risk Briefing Agent", "project-risk-briefing-agent.png", "timeline/roadmap + risk indicator", "project status, risk, stakeholder briefing", "project"),
    ("Renewal Health Agent", "renewal-health-agent.png", "customer/account + circular renewal arrow + health/trend", "renewal readiness, account health, customer success risk", "renewal"),
    ("Compliance Evidence Agent", "compliance-evidence-agent.png", "clipboard/file + shield", "compliance evidence, audit controls, review readiness", "evidence"),
    ("KPI Anomaly Review Agent", "kpi-anomaly-review-agent.png", "chart + anomaly marker", "operations metric review, anomaly detection", "kpi"),
    ("Executive Briefing Agent", "executive-briefing-agent.png", "dashboard/card + summary/briefing cue", "leadership summary and executive decision support", "executive"),
]

COPILOTS = [
    ("Procurement Onboarding Copilot", "procurement-onboarding-copilot.png", "speech bubble + supplier document/check", "procurement onboarding guidance", "supplier"),
    ("Sales Opportunity Copilot", "sales-opportunity-copilot.png", "speech bubble + target/opportunity cue", "sales opportunity guidance", "lead"),
    ("Support Resolution Copilot", "support-resolution-copilot.png", "speech bubble + headset/check/help cue", "support resolution guidance", "support"),
    ("Contract Review Copilot", "contract-review-copilot.png", "speech bubble + document/magnifier cue", "contract review guidance", "contract"),
    ("Finance Operations Copilot", "finance-operations-copilot.png", "speech bubble + invoice/finance cue", "finance operations guidance", "invoice"),
    ("Procurement Policy Copilot", "procurement-policy-copilot.png", "speech bubble + checklist/policy cue", "procurement policy guidance", "policy"),
    ("Employee HR Copilot", "employee-hr-copilot.png", "speech bubble + employee/profile cue", "employee HR guidance", "hr"),
    ("PMO Copilot", "pmo-copilot.png", "speech bubble + timeline/project cue", "PMO project guidance", "project"),
    ("Customer Success Copilot", "customer-success-copilot.png", "speech bubble + account health/growth cue", "customer success guidance", "renewal"),
    ("Compliance Review Copilot", "compliance-review-copilot.png", "speech bubble + shield/document cue", "compliance review guidance", "evidence"),
    ("Operations Insight Copilot", "operations-insight-copilot.png", "speech bubble + chart/insight cue", "operations insight guidance", "kpi"),
    ("Executive Operations Copilot", "executive-operations-copilot.png", "speech bubble + dashboard/briefing cue", "executive operations guidance", "executive"),
]


def rgba(hex_color):
    h = hex_color.lstrip("#")
    return tuple(int(h[i:i + 2], 16) for i in (0, 2, 4)) + (255,)


class Canvas:
    def __init__(self, w, h, bg=(0, 0, 0, 0), scale=4):
        self.w = w
        self.h = h
        self.scale = scale
        self.W = w * scale
        self.H = h * scale
        self.px = [bg] * (self.W * self.H)

    def _blend(self, x, y, color):
        if x < 0 or y < 0 or x >= self.W or y >= self.H:
            return
        r, g, b, a = color
        i = y * self.W + x
        br, bg, bb, ba = self.px[i]
        af = a / 255.0
        bf = ba / 255.0 * (1 - af)
        outa = af + bf
        if outa == 0:
            self.px[i] = (0, 0, 0, 0)
            return
        self.px[i] = (
            int((r * af + br * bf) / outa + 0.5),
            int((g * af + bg * bf) / outa + 0.5),
            int((b * af + bb * bf) / outa + 0.5),
            int(outa * 255 + 0.5),
        )

    def rect(self, x, y, w, h, fill):
        s = self.scale
        for yy in range(round(y * s), round((y + h) * s)):
            for xx in range(round(x * s), round((x + w) * s)):
                self._blend(xx, yy, fill)

    def rounded_rect(self, x, y, w, h, r, fill, stroke=None, sw=1):
        self._rounded_rect_fill(x, y, w, h, r, fill)
        if stroke and sw:
            for k in range(int(sw * self.scale)):
                inset = k / self.scale
                self._rounded_rect_outline(x + inset, y + inset, w - 2 * inset, h - 2 * inset, max(0, r - inset), stroke)

    def _rounded_rect_fill(self, x, y, w, h, r, fill):
        s = self.scale
        X0, Y0, X1, Y1, R = [v * s for v in (x, y, x + w, y + h, r)]
        for yy in range(math.floor(Y0), math.ceil(Y1)):
            cy = yy + 0.5
            for xx in range(math.floor(X0), math.ceil(X1)):
                cx = xx + 0.5
                qx = min(max(cx, X0 + R), X1 - R)
                qy = min(max(cy, Y0 + R), Y1 - R)
                if (cx - qx) ** 2 + (cy - qy) ** 2 <= R ** 2:
                    self._blend(xx, yy, fill)

    def _rounded_rect_outline(self, x, y, w, h, r, color):
        self.line([(x + r, y), (x + w - r, y), (x + w, y + r), (x + w, y + h - r), (x + w - r, y + h), (x + r, y + h), (x, y + h - r), (x, y + r), (x + r, y)], color, 1)
        self.arc(x + r, y + r, r, 180, 270, color, 1)
        self.arc(x + w - r, y + r, r, 270, 360, color, 1)
        self.arc(x + w - r, y + h - r, r, 0, 90, color, 1)
        self.arc(x + r, y + h - r, r, 90, 180, color, 1)

    def circle(self, cx, cy, r, fill, stroke=None, sw=1):
        s = self.scale
        CX, CY, R = cx * s, cy * s, r * s
        for yy in range(math.floor(CY - R), math.ceil(CY + R)):
            for xx in range(math.floor(CX - R), math.ceil(CX + R)):
                d = (xx + 0.5 - CX) ** 2 + (yy + 0.5 - CY) ** 2
                if d <= R * R:
                    self._blend(xx, yy, fill)
        if stroke:
            self.ring(cx, cy, r, stroke, sw)

    def ring(self, cx, cy, r, color, sw=2):
        s = self.scale
        CX, CY, R, W = cx * s, cy * s, r * s, sw * s
        for yy in range(math.floor(CY - R - W), math.ceil(CY + R + W)):
            for xx in range(math.floor(CX - R - W), math.ceil(CX + R + W)):
                d = math.hypot(xx + 0.5 - CX, yy + 0.5 - CY)
                if R - W / 2 <= d <= R + W / 2:
                    self._blend(xx, yy, color)

    def line(self, pts, color, sw=2):
        for a, b in zip(pts, pts[1:]):
            self._segment(a[0], a[1], b[0], b[1], color, sw)

    def _segment(self, x1, y1, x2, y2, color, sw):
        s = self.scale
        x1, y1, x2, y2, radius = x1 * s, y1 * s, x2 * s, y2 * s, sw * s / 2
        minx, maxx = math.floor(min(x1, x2) - radius - 1), math.ceil(max(x1, x2) + radius + 1)
        miny, maxy = math.floor(min(y1, y2) - radius - 1), math.ceil(max(y1, y2) + radius + 1)
        dx, dy = x2 - x1, y2 - y1
        denom = dx * dx + dy * dy
        for yy in range(miny, maxy + 1):
            for xx in range(minx, maxx + 1):
                if denom == 0:
                    d = math.hypot(xx - x1, yy - y1)
                else:
                    t = max(0, min(1, ((xx - x1) * dx + (yy - y1) * dy) / denom))
                    d = math.hypot(xx - (x1 + t * dx), yy - (y1 + t * dy))
                if d <= radius:
                    self._blend(xx, yy, color)

    def polygon(self, pts, fill, stroke=None, sw=1):
        spts = [(x * self.scale, y * self.scale) for x, y in pts]
        minx = math.floor(min(x for x, _ in spts))
        maxx = math.ceil(max(x for x, _ in spts))
        miny = math.floor(min(y for _, y in spts))
        maxy = math.ceil(max(y for _, y in spts))
        n = len(spts)
        for yy in range(miny, maxy + 1):
            for xx in range(minx, maxx + 1):
                inside = False
                j = n - 1
                for i in range(n):
                    xi, yi = spts[i]
                    xj, yj = spts[j]
                    if ((yi > yy) != (yj > yy)) and (xx < (xj - xi) * (yy - yi) / ((yj - yi) or 1) + xi):
                        inside = not inside
                    j = i
                if inside:
                    self._blend(xx, yy, fill)
        if stroke:
            self.line(pts + [pts[0]], stroke, sw)

    def arc(self, cx, cy, r, start, end, color, sw=2, steps=28):
        pts = []
        if end < start:
            end += 360
        for i in range(steps + 1):
            a = math.radians(start + (end - start) * i / steps)
            pts.append((cx + math.cos(a) * r, cy + math.sin(a) * r))
        self.line(pts, color, sw)

    def arrow_head(self, x, y, angle, color, size=5):
        a = math.radians(angle)
        pts = [(x, y)]
        for off in (145, -145):
            aa = a + math.radians(off)
            pts.append((x + math.cos(aa) * size, y + math.sin(aa) * size))
        self.polygon(pts, color)

    def downsample(self):
        s = self.scale
        out = []
        for y in range(self.h):
            for x in range(self.w):
                acc = [0, 0, 0, 0]
                for yy in range(y * s, (y + 1) * s):
                    for xx in range(x * s, (x + 1) * s):
                        p = self.px[yy * self.W + xx]
                        for i in range(4):
                            acc[i] += p[i]
                div = s * s
                out.append(tuple(round(v / div) for v in acc))
        return out


def write_png(path, w, h, pixels):
    raw = bytearray()
    for y in range(h):
        raw.append(0)
        for p in pixels[y * w:(y + 1) * w]:
            raw.extend(bytes(p))
    def chunk(kind, data):
        return struct.pack(">I", len(data)) + kind + data + struct.pack(">I", zlib.crc32(kind + data) & 0xffffffff)
    data = b"\x89PNG\r\n\x1a\n"
    data += chunk(b"IHDR", struct.pack(">IIBBBBB", w, h, 8, 6, 0, 0, 0))
    data += chunk(b"IDAT", zlib.compress(bytes(raw), 9))
    data += chunk(b"IEND", b"")
    path.write_bytes(data)


def base_icon(kind):
    c = Canvas(64, 64, BG, 4)
    if kind == "agent":
        c.rounded_rect(2, 2, 60, 60, 14, (248, 251, 255, 255), BORDER, 1)
        c.rounded_rect(8, 8, 48, 48, 12, BLUE_SOFT, (206, 222, 248, 255), 1)
        c.circle(50, 14, 3, PURPLE)
    else:
        c.rounded_rect(2, 2, 60, 60, 14, (250, 248, 255, 255), (222, 214, 253, 255), 1)
        c.rounded_rect(8, 9, 48, 40, 13, PURPLE_SOFT, (218, 208, 255, 255), 1)
        c.polygon([(21, 48), (28, 48), (21, 55)], PURPLE_SOFT, (218, 208, 255, 255), 1)
        c.circle(47, 17, 2.5, BLUE)
    return c


def doc(c, x=18, y=15, w=24, h=32, color=BLUE):
    c.rounded_rect(x, y, w, h, 3, WHITE, color, 2)
    c.line([(x + 7, y + 10), (x + w - 6, y + 10)], SLATE, 1.6)
    c.line([(x + 7, y + 17), (x + w - 6, y + 17)], SLATE, 1.6)
    c.line([(x + 7, y + 24), (x + w - 10, y + 24)], SLATE, 1.6)


def shield(c, cx=42, cy=36, color=BLUE):
    c.polygon([(cx, cy - 13), (cx + 11, cy - 8), (cx + 9, cy + 8), (cx, cy + 15), (cx - 9, cy + 8), (cx - 11, cy - 8)], (255, 255, 255, 255), color, 2)
    c.line([(cx - 5, cy + 1), (cx - 1, cy + 5), (cx + 6, cy - 4)], color, 2.5)


def target(c, cx=31, cy=31):
    c.ring(cx, cy, 16, BLUE, 2.2)
    c.ring(cx, cy, 9, PURPLE, 2)
    c.circle(cx, cy, 3, BLUE)
    c.line([(cx + 11, cy - 11), (cx + 20, cy - 20)], BLUE_DARK, 2)
    c.arrow_head(cx + 21, cy - 21, -45, BLUE_DARK, 4)


def person_card(c):
    c.rounded_rect(16, 18, 32, 26, 5, WHITE, BLUE, 2)
    c.circle(27, 29, 5, PURPLE_SOFT, BLUE, 1.5)
    c.arc(27, 40, 8, 205, 335, BLUE, 2)
    c.line([(36, 28), (44, 28), (36, 35), (43, 35)], SLATE, 1.5)


def headset(c, x=20, y=20):
    c.arc(32, 33, 15, 190, 350, BLUE, 2.8)
    c.rounded_rect(17, 31, 7, 12, 3, WHITE, BLUE, 2)
    c.rounded_rect(40, 31, 7, 12, 3, WHITE, BLUE, 2)
    c.line([(40, 43), (35, 48), (30, 48)], BLUE, 2.4)
    c.circle(29, 48, 2, PURPLE)


def magnifier(c):
    doc(c, 17, 14, 24, 30, BLUE)
    c.circle(41, 40, 8, (255, 255, 255, 0), PURPLE, 2.5)
    c.line([(47, 46), (53, 52)], PURPLE, 2.5)


def warning(c):
    doc(c, 18, 14, 24, 32, BLUE)
    c.polygon([(45, 29), (56, 49), (34, 49)], (255, 246, 251, 255), PURPLE, 2)
    c.line([(45, 36), (45, 43)], PURPLE, 2)
    c.circle(45, 46, 1.5, PINK)


def checklist(c):
    doc(c, 18, 13, 28, 36, BLUE)
    for y in (25, 33, 41):
        c.line([(23, y), (26, y + 3), (31, y - 3)], BLUE, 2)
        c.line([(34, y), (43, y)], SLATE, 1.5)


def branch_user(c):
    c.circle(25, 24, 6, WHITE, BLUE, 2)
    c.arc(25, 39, 11, 205, 335, BLUE, 2.4)
    c.line([(38, 22), (45, 22), (45, 30), (38, 30), (38, 22)], PURPLE, 2)
    c.line([(34, 34), (44, 34), (44, 42), (34, 42), (34, 34)], BLUE_DARK, 2)
    c.line([(33, 30), (38, 26), (33, 38)], SLATE, 1.6)


def roadmap(c):
    c.line([(17, 42), (25, 26), (36, 34), (48, 18)], BLUE, 3)
    for p, col in [((17, 42), BLUE), ((25, 26), PURPLE), ((36, 34), BLUE), ((48, 18), PURPLE)]:
        c.circle(p[0], p[1], 4, WHITE, col, 2)
    c.polygon([(45, 40), (54, 54), (36, 54)], (255, 246, 251, 255), PURPLE, 2)
    c.line([(45, 45), (45, 50)], PURPLE, 1.8)


def renewal(c):
    c.circle(28, 30, 6, WHITE, BLUE, 2)
    c.arc(28, 43, 11, 205, 335, BLUE, 2.2)
    c.arc(39, 34, 14, 30, 305, PURPLE, 2.4)
    c.arrow_head(50, 26, 35, PURPLE, 4)
    c.line([(35, 44), (41, 39), (46, 42), (52, 34)], BLUE_DARK, 2.4)


def evidence(c):
    c.rounded_rect(18, 13, 28, 36, 4, WHITE, BLUE, 2)
    c.rounded_rect(25, 10, 14, 6, 3, PURPLE_SOFT, PURPLE, 1.5)
    c.line([(24, 25), (40, 25), (24, 33), (38, 33)], SLATE, 1.5)
    shield(c, 43, 41, BLUE)


def chart_anomaly(c):
    c.line([(17, 47), (49, 47)], SLATE, 1.5)
    c.rect(20, 34, 5, 13, BLUE)
    c.rect(30, 27, 5, 20, BLUE)
    c.rect(40, 19, 5, 28, PURPLE)
    c.circle(48, 18, 4, (255, 246, 251, 255), PINK, 2)


def dashboard(c):
    c.rounded_rect(15, 16, 34, 32, 5, WHITE, BLUE, 2)
    c.rect(21, 22, 10, 8, BLUE_SOFT)
    c.rect(34, 22, 9, 8, PURPLE_SOFT)
    c.line([(21, 37), (28, 33), (35, 36), (43, 30)], BLUE, 2)
    c.line([(22, 43), (42, 43)], SLATE, 1.5)


DRAWERS = {
    "supplier": lambda c: (doc(c, 16, 13, 25, 34, BLUE), shield(c, 43, 38, BLUE)),
    "lead": lambda c: (target(c), person_card(c)),
    "support": headset,
    "contract": magnifier,
    "invoice": warning,
    "policy": checklist,
    "hr": branch_user,
    "project": roadmap,
    "renewal": renewal,
    "evidence": evidence,
    "kpi": chart_anomaly,
    "executive": dashboard,
}


def draw_chat_overlay(c, key):
    c.rounded_rect(14, 18, 36, 27, 8, WHITE, PURPLE, 2)
    c.polygon([(24, 44), (31, 44), (24, 51)], WHITE, PURPLE, 2)
    if key == "supplier":
        doc(c, 22, 23, 14, 16, BLUE)
        c.line([(38, 34), (41, 37), (46, 29)], BLUE, 2)
    elif key == "lead":
        c.ring(32, 32, 9, BLUE, 2)
        c.ring(32, 32, 4, PURPLE, 1.7)
        c.circle(32, 32, 1.8, BLUE)
    elif key == "support":
        c.arc(32, 33, 10, 195, 345, BLUE, 2)
        c.rounded_rect(20, 31, 5, 8, 2, WHITE, BLUE, 1.5)
        c.rounded_rect(39, 31, 5, 8, 2, WHITE, BLUE, 1.5)
        c.line([(35, 41), (39, 37), (44, 29)], PURPLE, 2)
    elif key == "contract":
        doc(c, 22, 22, 14, 18, BLUE)
        c.circle(40, 37, 5, (255, 255, 255, 0), PURPLE, 1.8)
        c.line([(44, 41), (48, 45)], PURPLE, 2)
    elif key == "invoice":
        doc(c, 22, 22, 14, 18, BLUE)
        c.polygon([(42, 29), (48, 41), (36, 41)], (255, 246, 251, 255), PURPLE, 1.5)
    elif key == "policy":
        for y in (27, 33, 39):
            c.line([(23, y), (26, y + 2), (30, y - 3)], BLUE, 1.8)
            c.line([(33, y), (43, y)], SLATE, 1.4)
    elif key == "hr":
        c.circle(29, 30, 5, WHITE, BLUE, 1.8)
        c.arc(29, 41, 9, 210, 330, BLUE, 2)
        c.rounded_rect(38, 27, 8, 8, 2, PURPLE_SOFT, PURPLE, 1.5)
    elif key == "project":
        c.line([(22, 39), (29, 28), (37, 34), (45, 25)], BLUE, 2.4)
        c.circle(22, 39, 3, WHITE, BLUE, 1.6)
        c.circle(29, 28, 3, WHITE, PURPLE, 1.6)
        c.circle(45, 25, 3, WHITE, PURPLE, 1.6)
    elif key == "renewal":
        c.circle(28, 31, 4, WHITE, BLUE, 1.8)
        c.arc(38, 33, 10, 35, 310, PURPLE, 2)
        c.arrow_head(46, 27, 35, PURPLE, 3)
        c.line([(31, 39), (37, 35), (42, 38), (47, 31)], BLUE, 2)
    elif key == "evidence":
        doc(c, 22, 22, 14, 18, BLUE)
        shield(c, 41, 36, PURPLE)
    elif key == "kpi":
        c.rect(23, 34, 4, 7, BLUE)
        c.rect(31, 29, 4, 12, BLUE)
        c.rect(39, 24, 4, 17, PURPLE)
        c.circle(45, 24, 3, (255, 246, 251, 255), PINK, 1.6)
    elif key == "executive":
        c.rounded_rect(22, 24, 22, 17, 3, (248, 251, 255, 255), BLUE, 1.6)
        c.rect(26, 28, 6, 5, BLUE_SOFT)
        c.rect(35, 28, 5, 5, PURPLE_SOFT)
        c.line([(26, 37), (40, 37)], SLATE, 1.3)


def make_icon(kind, key):
    c = base_icon(kind)
    if kind == "agent":
        DRAWERS[key](c)
    else:
        draw_chat_overlay(c, key)
    return c.downsample()


FONT = {
    "A": ["01110", "10001", "10001", "11111", "10001", "10001", "10001"],
    "B": ["11110", "10001", "10001", "11110", "10001", "10001", "11110"],
    "C": ["01111", "10000", "10000", "10000", "10000", "10000", "01111"],
    "D": ["11110", "10001", "10001", "10001", "10001", "10001", "11110"],
    "E": ["11111", "10000", "10000", "11110", "10000", "10000", "11111"],
    "F": ["11111", "10000", "10000", "11110", "10000", "10000", "10000"],
    "G": ["01111", "10000", "10000", "10111", "10001", "10001", "01111"],
    "H": ["10001", "10001", "10001", "11111", "10001", "10001", "10001"],
    "I": ["11111", "00100", "00100", "00100", "00100", "00100", "11111"],
    "J": ["00111", "00010", "00010", "00010", "10010", "10010", "01100"],
    "K": ["10001", "10010", "10100", "11000", "10100", "10010", "10001"],
    "L": ["10000", "10000", "10000", "10000", "10000", "10000", "11111"],
    "M": ["10001", "11011", "10101", "10101", "10001", "10001", "10001"],
    "N": ["10001", "11001", "10101", "10011", "10001", "10001", "10001"],
    "O": ["01110", "10001", "10001", "10001", "10001", "10001", "01110"],
    "P": ["11110", "10001", "10001", "11110", "10000", "10000", "10000"],
    "Q": ["01110", "10001", "10001", "10001", "10101", "10010", "01101"],
    "R": ["11110", "10001", "10001", "11110", "10100", "10010", "10001"],
    "S": ["01111", "10000", "10000", "01110", "00001", "00001", "11110"],
    "T": ["11111", "00100", "00100", "00100", "00100", "00100", "00100"],
    "U": ["10001", "10001", "10001", "10001", "10001", "10001", "01110"],
    "V": ["10001", "10001", "10001", "10001", "10001", "01010", "00100"],
    "W": ["10001", "10001", "10001", "10101", "10101", "11011", "10001"],
    "X": ["10001", "10001", "01010", "00100", "01010", "10001", "10001"],
    "Y": ["10001", "10001", "01010", "00100", "00100", "00100", "00100"],
    "Z": ["11111", "00001", "00010", "00100", "01000", "10000", "11111"],
    "0": ["01110", "10001", "10011", "10101", "11001", "10001", "01110"],
    "1": ["00100", "01100", "00100", "00100", "00100", "00100", "01110"],
    "2": ["01110", "10001", "00001", "00010", "00100", "01000", "11111"],
    "3": ["11110", "00001", "00001", "01110", "00001", "00001", "11110"],
    "4": ["10010", "10010", "10010", "11111", "00010", "00010", "00010"],
    "5": ["11111", "10000", "10000", "11110", "00001", "00001", "11110"],
    "6": ["01111", "10000", "10000", "11110", "10001", "10001", "01110"],
    "7": ["11111", "00001", "00010", "00100", "01000", "01000", "01000"],
    "8": ["01110", "10001", "10001", "01110", "10001", "10001", "01110"],
    "9": ["01110", "10001", "10001", "01111", "00001", "00001", "11110"],
    "-": ["00000", "00000", "00000", "11111", "00000", "00000", "00000"],
    " ": ["00000", "00000", "00000", "00000", "00000", "00000", "00000"],
    "/": ["00001", "00010", "00010", "00100", "01000", "01000", "10000"],
}


def draw_text(c, text, x, y, color=INK, scale=1):
    cx = x
    for ch in text.upper():
        pat = FONT.get(ch, FONT[" "])
        for row, bits in enumerate(pat):
            for col, bit in enumerate(bits):
                if bit == "1":
                    c.rect(cx + col * scale, y + row * scale, scale, scale, color)
        cx += 6 * scale
    return cx


def wrap_label(label, max_chars=22):
    words = label.replace(" Copilot", "").replace(" Agent", "").split()
    lines = []
    cur = ""
    for word in words:
        nxt = f"{cur} {word}".strip()
        if len(nxt) <= max_chars:
            cur = nxt
        else:
            if cur:
                lines.append(cur)
            cur = word
    if cur:
        lines.append(cur)
    return lines[:2]


def paste_icon(sheet, pixels, x, y, w=64, h=64):
    for yy in range(h):
        for xx in range(w):
            r, g, b, a = pixels[yy * w + xx]
            sheet._blend((x + xx) * sheet.scale, (y + yy) * sheet.scale, (r, g, b, a))


def create_contact_sheet(icon_records):
    cols = 4
    cell_w = 170
    cell_h = 116
    margin = 30
    title_h = 42
    gap = 34
    w = margin * 2 + cols * cell_w
    h = margin + title_h + 3 * cell_h + gap + title_h + 3 * cell_h + margin
    c = Canvas(w, h, WHITE, 1)
    c.rect(0, 0, w, h, (248, 251, 255, 255))
    draw_text(c, "AI AGENT ICONS", margin, margin, BLUE_DARK, 2)
    y0 = margin + title_h
    for idx, rec in enumerate(icon_records[:12]):
        col = idx % cols
        row = idx // cols
        x = margin + col * cell_w
        y = y0 + row * cell_h
        c.rounded_rect(x, y, cell_w - 18, cell_h - 12, 8, WHITE, BORDER, 1)
        paste_icon(c, rec["pixels"], x + 44, y + 12)
        for li, line in enumerate(wrap_label(rec["template_name"])):
            tw = len(line) * 6
            draw_text(c, line, x + max(6, (cell_w - 18 - tw) // 2), y + 82 + li * 11, INK, 1)
    y1 = y0 + 3 * cell_h + gap
    draw_text(c, "COPILOT ICONS", margin, y1, PURPLE, 2)
    y2 = y1 + title_h
    for idx, rec in enumerate(icon_records[12:]):
        col = idx % cols
        row = idx // cols
        x = margin + col * cell_w
        y = y2 + row * cell_h
        c.rounded_rect(x, y, cell_w - 18, cell_h - 12, 8, WHITE, (222, 214, 253, 255), 1)
        paste_icon(c, rec["pixels"], x + 44, y + 12)
        for li, line in enumerate(wrap_label(rec["template_name"])):
            tw = len(line) * 6
            draw_text(c, line, x + max(6, (cell_w - 18 - tw) // 2), y + 82 + li * 11, INK, 1)
    return c.px, w, h


def main():
    for d in (AGENT_DIR, COPILOT_DIR, PREVIEW_DIR):
        d.mkdir(parents=True, exist_ok=True)

    records = []
    rendered = []

    for template_type, folder, items, kind in [
        ("AI Agent", AGENT_DIR, AGENTS, "agent"),
        ("Copilot", COPILOT_DIR, COPILOTS, "copilot"),
    ]:
        for name, filename, concept, purpose, key in items:
            pixels = make_icon(kind, key)
            path = folder / filename
            write_png(path, 64, 64, pixels)
            size_kb = path.stat().st_size / 1024
            passed = size_kb < 50
            rec = {
                "template_type": template_type,
                "template_name": name,
                "filename": filename,
                "folder_path": str(folder.relative_to(ROOT)),
                "image_size_pixels": "64x64",
                "file_size_kb": round(size_kb, 2),
                "visual_concept": concept,
                "quality_checks_passed": passed,
                "notes": "Logo-free; no text in icon; simple business pictogram.",
            }
            records.append(rec)
            rendered.append({**rec, "pixels": pixels})

    sheet_pixels, sheet_w, sheet_h = create_contact_sheet(rendered)
    sheet_path = PREVIEW_DIR / "icon-contact-sheet.png"
    write_png(sheet_path, sheet_w, sheet_h, sheet_pixels)

    manifest_path = OUT / "icon_manifest.json"
    manifest_path.write_text(json.dumps(records, indent=2), encoding="utf-8")

    md = ["# Template Icon Manifest", "", "| Type | Template | Filename | Path | Size | Concept | Passed |", "|---|---|---|---|---:|---|---|"]
    for r in records:
        md.append(f"| {r['template_type']} | {r['template_name']} | `{r['filename']}` | `{r['folder_path']}` | {r['file_size_kb']:.2f} KB | {r['visual_concept']} | {'Yes' if r['quality_checks_passed'] else 'No'} |")
    (OUT / "icon_manifest.md").write_text("\n".join(md) + "\n", encoding="utf-8")

    report = [
        "# Template Icon Generation Report",
        "",
        "## Summary",
        "",
        "Generated 24 logo-free 64x64 PNG template icons for Yeeflow AI Agent and Copilot templates.",
        "The icons use a shared rounded-square product tile system, Yeeflow blue as the primary anchor, restrained purple AI/conversation accents, no text inside the final 64x64 icons, and no Yeeflow logo or approximate brand mark.",
        "",
        "## Quality Checks",
        "",
        f"- Exactly 24 PNG icon files: {'Yes' if len(records) == 24 else 'No'}",
        "- Each icon is exactly 64x64 px: Yes",
        f"- Each icon is under 50 KB: {'Yes' if all(r['quality_checks_passed'] for r in records) else 'No'}",
        "- Icons are logo-free and contain no text labels: Yes",
        "- AI Agent and Copilot sets are visually distinguishable: Yes; Copilots consistently use a speech-bubble motif.",
        "- Contact sheet exists: Yes",
        "- Manifest files exist: Yes",
        "",
        "## Generated Files",
        "",
        "| Type | File | Size |",
        "|---|---|---:|",
    ]
    for r in records:
        report.append(f"| {r['template_type']} | `{r['folder_path']}/{r['filename']}` | {r['file_size_kb']:.2f} KB |")
    report += [
        "",
        "## Assumptions And Issues",
        "",
        "- Used the explicit template list from the request as canonical because it matches the catalog purpose and gives exact required filenames.",
        "- Source Word documents were present, but embedded document branding was intentionally not reused in the icons.",
        "- No external image assets or brand logos were used.",
        "",
        "## Paths",
        "",
        f"- AI Agent icons: `{AGENT_DIR.relative_to(ROOT)}`",
        f"- Copilot icons: `{COPILOT_DIR.relative_to(ROOT)}`",
        f"- Contact sheet: `{sheet_path.relative_to(ROOT)}`",
        f"- JSON manifest: `{manifest_path.relative_to(ROOT)}`",
        f"- Markdown manifest: `{(OUT / 'icon_manifest.md').relative_to(ROOT)}`",
    ]
    (OUT / "generation_report.md").write_text("\n".join(report) + "\n", encoding="utf-8")

    print(json.dumps({
        "icons": len(records),
        "contact_sheet": str(sheet_path.relative_to(ROOT)),
        "max_icon_kb": max(r["file_size_kb"] for r in records),
        "min_icon_kb": min(r["file_size_kb"] for r in records),
    }, indent=2))


if __name__ == "__main__":
    main()
