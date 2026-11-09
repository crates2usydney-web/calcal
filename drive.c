#include <ApplicationServices/ApplicationServices.h>
#include <stdio.h>
#include <stdlib.h>
#include <string.h>
#include <unistd.h>

static void evScroll(CGPoint p, int dy) {
  CGEventRef e = CGEventCreateScrollWheelEvent(NULL, kCGScrollEventUnitLine, 1, dy);
  CGEventSetLocation(e, p);
  CGEventPost(kCGHIDEventTap, e);
  CFRelease(e);
}
static void evMove(CGPoint p) {
  CGEventRef e = CGEventCreateMouseEvent(NULL, kCGEventMouseMoved, p, kCGMouseButtonLeft);
  CGEventPost(kCGHIDEventTap, e);
  CFRelease(e);
}
static void evClick(CGPoint p) {
  CGEventRef d = CGEventCreateMouseEvent(NULL, kCGEventLeftMouseDown, p, kCGMouseButtonLeft);
  CGEventPost(kCGHIDEventTap, d); CFRelease(d);
  usleep(60000);
  CGEventRef u = CGEventCreateMouseEvent(NULL, kCGEventLeftMouseUp, p, kCGMouseButtonLeft);
  CGEventPost(kCGHIDEventTap, u); CFRelease(u);
}
static void evText(const char *s) {
  const char *p = s;
  while (*p) {
    UniChar buf[2]; int n = 1;
    unsigned char c = (unsigned char)*p;
    if (c < 0x80) { buf[0] = c; p++; }
    else if ((c & 0xE0) == 0xC0) { buf[0] = ((c & 0x1F) << 6) | (p[1] & 0x3F); p += 2; }
    else if ((c & 0xF0) == 0xE0) { buf[0] = ((c & 0x0F) << 12) | ((p[1] & 0x3F) << 6) | (p[2] & 0x3F); p += 3; }
    else { buf[0] = '?'; p++; }
    CGEventRef down = CGEventCreateKeyboardEvent(NULL, 0, true);
    CGEventKeyboardSetUnicodeString(down, n, buf);
    CGEventPost(kCGHIDEventTap, down); CFRelease(down);
    CGEventRef up = CGEventCreateKeyboardEvent(NULL, 0, false);
    CGEventKeyboardSetUnicodeString(up, n, buf);
    CGEventPost(kCGHIDEventTap, up); CFRelease(up);
    usleep(15000);
  }
}
static void evKeyFlags(CGKeyCode code, CGEventFlags flags) {
  CGEventRef d = CGEventCreateKeyboardEvent(NULL, code, true);
  if (flags) CGEventSetFlags(d, flags);
  CGEventPost(kCGHIDEventTap, d); CFRelease(d);
  usleep(40000);
  CGEventRef u = CGEventCreateKeyboardEvent(NULL, code, false);
  if (flags) CGEventSetFlags(u, flags);
  CGEventPost(kCGHIDEventTap, u); CFRelease(u);
}
static void evKey(CGKeyCode code) { evKeyFlags(code, 0); }

static void setWindowBounds(pid_t pid, double x, double y, double w, double h) {
  AXUIElementRef app = AXUIElementCreateApplication(pid);
  CFTypeRef wins = NULL;
  if (AXUIElementCopyAttributeValue(app, kAXWindowsAttribute, &wins) != kAXErrorSuccess || !wins) {
    printf("no windows\n"); CFRelease(app); return;
  }
  CFArrayRef arr = (CFArrayRef)wins;
  CFIndex count = CFArrayGetCount(arr);
  CGPoint pos = CGPointMake(x, y);
  CGSize size = CGSizeMake(w, h);
  for (CFIndex i = 0; i < count; i++) {
    AXUIElementRef win = (AXUIElementRef)CFArrayGetValueAtIndex(arr, i);
    AXValueRef pv = AXValueCreate(kAXValueCGPointType, &pos);
    AXValueRef sv = AXValueCreate(kAXValueCGSizeType, &size);
    AXUIElementSetAttributeValue(win, kAXPositionAttribute, pv);
    AXUIElementSetAttributeValue(win, kAXSizeAttribute, sv);
    CFRelease(pv); CFRelease(sv);
  }
  printf("resized %ld windows\n", (long)count);
  CFRelease(wins);
  CFRelease(app);
}

int main(int argc, char **argv) {
  if (argc < 2) { printf("usage: front <pid> | bounds <pid> x y w h | click x y | scroll x y dy | move x y | type text | key <code>\n"); return 2; }
  if (!strcmp(argv[1], "bounds") && argc == 7) {
    setWindowBounds((pid_t)atoi(argv[2]), atof(argv[3]), atof(argv[4]), atof(argv[5]), atof(argv[6]));
  } else if (!strcmp(argv[1], "front") && argc == 3) {
    AXUIElementRef app = AXUIElementCreateApplication(atoi(argv[2]));
    AXUIElementSetAttributeValue(app, CFSTR("AXFrontmost"), kCFBooleanTrue);
    CFRelease(app);
    printf("fronted\n");
  } else if (!strcmp(argv[1], "click") && argc == 4) {
    evMove(CGPointMake(atof(argv[2]), atof(argv[3])));
    usleep(80000);
    evClick(CGPointMake(atof(argv[2]), atof(argv[3])));
    printf("clicked\n");
  } else if (!strcmp(argv[1], "scroll") && argc == 5) {
    evMove(CGPointMake(atof(argv[2]), atof(argv[3])));
    usleep(80000);
    evScroll(CGPointMake(atof(argv[2]), atof(argv[3])), atoi(argv[4]));
    printf("scrolled\n");
  } else if (!strcmp(argv[1], "move") && argc == 4) {
    evMove(CGPointMake(atof(argv[2]), atof(argv[3])));
    printf("moved\n");
  } else if (!strcmp(argv[1], "type") && argc == 3) {
    evText(argv[2]);
    printf("typed\n");
  } else if (!strcmp(argv[1], "key") && argc >= 3) {
    CGEventFlags flags = 0;
    for (int i = 3; i < argc; i++) {
      if (!strcmp(argv[i], "cmd")) flags |= kCGEventFlagMaskCommand;
      if (!strcmp(argv[i], "shift")) flags |= kCGEventFlagMaskShift;
      if (!strcmp(argv[i], "opt")) flags |= kCGEventFlagMaskAlternate;
      if (!strcmp(argv[i], "ctrl")) flags |= kCGEventFlagMaskControl;
    }
    evKeyFlags((CGKeyCode)atoi(argv[2]), flags);
    printf("keyed\n");
  } else { printf("bad args\n"); return 2; }
  return 0;
}
