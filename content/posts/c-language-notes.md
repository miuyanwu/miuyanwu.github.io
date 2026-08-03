---
title: "C 语言学习笔记：指针，从数组到函数"
date: 2026-07-20
tags: ["C语言", "学习笔记"]
---

# C 语言学习笔记：指针，从数组到函数

用惯了 Python 再学 C，指针是第一个坎。这份笔记按"为什么要这样"来写，而不是只抄语法。

## 指针就是地址

变量的值存在内存里，`&a` 取出它的地址；指针就是存放地址的变量：

```c
#include <stdio.h>

int main(void) {
    int a = 42;
    int *p = &a;         // p 里存的是 a 的地址

    printf("a = %d\n", a);    // 42
    printf("*p = %d\n", *p);  // 42，*p 是解引用
    *p = 100;                 // 通过指针修改 a
    printf("a = %d\n", a);    // 100
    return 0;
}
```

## 数组名会"退化"成指针

数组名在表达式中会被当作指向首元素的指针，所以 `arr[i]` 等价于 `*(arr + i)`：

```c
int arr[4] = {1, 2, 3, 4};
int *q = arr;          // 不需要 &，arr 本身退化为指针
printf("%d\n", *(q + 2)); // 3
```

两个易错点：

- `sizeof(arr)` 在数组定义处返回整个数组的字节数；一旦传进函数，就只剩指针的 8 字节（64 位平台）；
- 指针加法移动的单位是"所指类型的大小"，不是字节——`q + 1` 跳过的是 4 个字节（对 `int` 而言）。

## 函数参数：传值还是传指针

C 的参数一律传值。想让函数修改调用方的变量，就要传地址：

```c
void swap(int *x, int *y) {
    int t = *x;
    *x = *y;
    *y = t;
}
```

## 动态内存：malloc 与配对的 free

```c
#include <stdlib.h>
#include <stdio.h>

int main(void) {
    int *nums = malloc(10 * sizeof(int));
    if (nums == NULL) {        // 分配失败返回 NULL
        perror("malloc");
        return 1;
    }
    for (int i = 0; i < 10; i++)
        nums[i] = i * i;
    free(nums);                // 和 malloc 配对，忘了就是内存泄漏
    return 0;
}
```

## 三条经验

> 先把"变量、指针、内存"画成方框和箭头，再看代码，大部分混淆会自己消失。

1. **先画图再写代码**——手画一张内存图，胜过十遍报错；
2. **把编译器的警告当 bug 查**——`-Wall -Wextra` 全开，零警告才往下走；
3. **valgrind 是内存课的老师**——`valgrind ./a.out` 直接告诉你哪里越界、哪里泄漏。

下一步：用单向链表重写 Favorite-sticker 里剪贴板历史的存储结构，亲身感受手动管理内存和垃圾回收的区别。
