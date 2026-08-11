# 파이썬 개발자를 위한 Vitest 가이드

이 문서는 파이썬의 `pytest`나 `unittest`에 익숙한 개발자가 프론트엔드 환경에서 자주 쓰이는 테스트 프레임워크인 **Vitest**에 빠르게 적응할 수 있도록 돕기 위해 작성되었습니다.

## 1. Vitest란?
Vitest는 Vite를 기반으로 하는 빠르고 현대적인 테스트 프레임워크입니다.
기존 자바스크립트/타입스크립트 테스트의 양대 산맥인 Jest의 문법을 거의 그대로 지원하므로, 사용성이 훌륭합니다.

## 2. 기본 문법 비교 (Python vs Vitest)

파이썬의 `pytest`와 비교해보겠습니다.

### 테스트 정의
**Python (pytest)**
```python
def test_addition():
    assert 1 + 1 == 2
```

**Vitest**
```typescript
import { it, expect } from "vitest";

it("더하기 테스트", () => {
  expect(1 + 1).toBe(2);
});
```

- 파이썬에서는 `def test_...` 형태로 테스트를 정의하지만, Vitest에서는 `it("설명", () => { ... })` 또는 `test("설명", () => { ... })` 함수를 사용합니다.

### 그룹화 (Grouping)
**Python (unittest/pytest 클래스)**
```python
class TestMathFunctions:
    def test_addition(self):
        assert 1 + 1 == 2

    def test_subtraction(self):
        assert 5 - 3 == 2
```

**Vitest**
```typescript
import { describe, it, expect } from "vitest";

describe("수학 함수 테스트", () => {
  it("더하기", () => {
    expect(1 + 1).toBe(2);
  });

  it("빼기", () => {
    expect(5 - 3).toBe(2);
  });
});
```
- Vitest에서는 `describe` 블록을 사용해 테스트를 그룹화합니다. 파이썬의 테스트 클래스와 비슷한 역할을 합니다.

### 단언문 (Assertions)
**Python**
```python
assert a == b
assert a != b
assert isinstance(a, str)
assert a is None
```

**Vitest**
```typescript
expect(a).toBe(b);         // 원시 타입 값 일치 (assert a == b)
expect(a).toEqual(b);      // 객체 깊은 비교 (리스트나 딕셔너리 비교에 사용)
expect(a).not.toBe(b);     // 불일치 (assert a != b)
expect(typeof a).toBe("string");
expect(a).toBeNull();      // (assert a is None)
```

## 3. Setup과 Teardown (테스트 전/후 처리)

파이썬의 `setup_method`, `teardown_method` 혹은 `pytest`의 `fixture`와 비슷한 역할을 하는 함수들이 있습니다.

**Vitest**
```typescript
import { beforeEach, afterEach, beforeAll, afterAll } from "vitest";

beforeAll(() => {
  // 모듈의 모든 테스트 시작 전에 한 번 실행 (Python의 setup_class)
});

beforeEach(() => {
  // 각각의 it() 테스트가 시작될 때마다 실행 (Python의 setup_method)
});

afterEach(() => {
  // 각각의 it() 테스트가 끝날 때마다 실행 (Python의 teardown_method)
});

afterAll(() => {
  // 모듈의 모든 테스트가 끝난 후 한 번 실행 (Python의 teardown_class)
});
```

## 4. 비동기 테스트 작성

파이썬 `pytest-asyncio`에서 `async def`를 쓰는 것처럼, Vitest에서도 `async/await`를 사용할 수 있습니다.

**Vitest**
```typescript
it("비동기 데이터 페칭 테스트", async () => {
  const data = await fetchData();
  expect(data).toBeDefined();
});
```

## 5. 모의 객체 (Mocking)

파이썬의 `unittest.mock.patch`나 `MagicMock`에 대응되는 기능입니다.

**Python**
```python
from unittest.mock import patch

@patch('my_module.my_function')
def test_something(mock_func):
    mock_func.return_value = "mocked!"
    assert my_module.my_function() == "mocked!"
```

**Vitest**
```typescript
import { vi, it, expect } from "vitest";
import * as myModule from "./myModule";

it("모킹 테스트", () => {
  const spy = vi.spyOn(myModule, "myFunction").mockReturnValue("mocked!");
  expect(myModule.myFunction()).toBe("mocked!");
  expect(spy).toHaveBeenCalled(); // 함수가 호출되었는지 검증 (assert_called)
});
```

## 6. 테스트 실행 방법
이번 프로젝트에서는 `package.json` 스크립트를 연결해 두었습니다.
터미널에서 아래 명령어를 실행하면 모든 테스트가 실행됩니다.
```bash
npm test
```
Vitest는 기본적으로 watch 모드로 실행되므로, 파일 저장 시 자동으로 테스트를 다시 실행해주는 장점이 있습니다. (CI 환경 등 한번만 실행하려면 `vitest run`을 씁니다.)
