#include <ApplicationServices/ApplicationServices.h>
#include <stdio.h>
int main(void){ printf("trusted=%d\n", AXIsProcessTrusted()); return 0; }