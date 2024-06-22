
from collections import OrderedDict
from collections.abc import Iterable
from typing import Protocol, TypeVar


def list_to_str(list: list[int]) -> str:
    if len(list) == 0:
        return '[]'
    return '[' + ' '.join([str(i) for i in list]) + ']'


def hex_to_array_str(hex: str) -> str:
    b = bytes.fromhex(hex)
    return list_to_str(list(b))


def serialize_list(input: list[int]) -> list[int]:
    res = [len(input)]
    for i in input:
        if isinstance(i, list):
            res.extend(serialize_list(i))
        if isinstance(i, int):
            res.append(i)
        if isinstance(i, bytes):
            res.extend(serialize_list(list(i)))
        if isinstance(i, Structure):
            res.extend(i.serde_serialize())
    return res


class Typed:
    _expected_type = type(None)

    def __init__(self, name=None):
        self._name = name

    def __set__(self, instance, value):
        if not isinstance(value, self._expected_type):
            raise TypeError('Expected ' + str(self._expected_type))
        instance.__dict__[self._name] = value


class Integer(Typed):
    _expected_type = int


class String(Typed):
    _expected_type = str


class List1D(Typed):
    _expected_type = list


class Bytes(Typed):
    _expected_type = bytes


class List2D(Typed):
    _expected_type = list


class ListBytes(Typed):
    _expected_type = list


class ListStruct(Typed):
    _expected_type = list


class Struct(Typed):
    _expected_type = object


class typeMeta:
    name: str
    type_name: type

    def __init__(self, name, type_name):
        self.name = name
        self.type_name = type_name


class OrderedMeta(type):
    _order: list[typeMeta]
    '''
    Metaclass that uses an OrderedDict for class body
    '''

    # remember the order of fields
    def __new__(cls, clsname, bases, clsdict):
        d = dict(clsdict)
        order = []
        for name, value in clsdict.items():
            if isinstance(value, Typed):
                value._name = name
                order.append(typeMeta(name, value.__class__))
        d['_order'] = order
        return type.__new__(cls, clsname, bases, d)

    @classmethod
    def __prepare__(cls, clsname, bases):
        return OrderedDict()


class Structure(metaclass=OrderedMeta):
    '''
    a base class that can auto-serialize itself to cairo struct in serde format
    '''

    def serde_serialize(self) -> list[int]:
        res = []

        for v in [getattr(self, name.name) for name in self._order]:
            if isinstance(v, int):
                res.append(v)
            if isinstance(v, list):
                res.extend(serialize_list(v))
            if isinstance(v, bytes):
                res.extend(serialize_list(list(v)))
            if isinstance(v, Structure):
                res.extend(v.serde_serialize())
        return res

    def to_str(self) -> str:
        res = ''
        for meta in self._order:
            v = getattr(self, meta.name)
            if isinstance(v, bytes):
                res += f'{meta.name}: {v.hex()}\n'
            elif meta.type_name == ListBytes().__class__:
                res += f'{meta.name}: {[i.hex() for i in v]}\n'
            elif meta.type_name == Struct().__class__:
                res += f'{meta.name}: {v.to_str()}\n'
            elif meta.type_name == ListStruct().__class__:
                res += f'{meta.name}: {[i.to_str().replace('\n', ', ')
                                        for i in v]}\n'
            else:
                res += f'{meta.name}: {v}\n'
        return res


def serde_deserialize(data: list[int], cls: Structure, cursor_p: list[int] = [0]) -> any:
    cursor = cursor_p[0]

    for meta in cls._order:
        if meta.type_name == Integer().__class__:
            setattr(cls, meta.name, data[cursor])
            cursor += 1
        if meta.type_name == Bytes().__class__:
            length = data[cursor]
            cursor += 1
            setattr(cls, meta.name, bytes(data[cursor:length + cursor]))
            cursor += length
        if meta.type_name == List1D().__class__:
            length = data[cursor]
            cursor += 1
            setattr(cls, meta.name, data[cursor:length + cursor])
            cursor += length
        if meta.type_name == List2D().__class__:
            length = data[cursor]
            cursor += 1
            v = []
            for i in range(length):
                length = data[cursor]
                cursor += 1
                v.append(data[cursor:length + cursor])
                cursor += length
            setattr(cls, meta.name, v)
        if meta.type_name == ListBytes().__class__:
            length = data[cursor]
            cursor += 1
            v = []
            for i in range(length):
                length = data[cursor]
                cursor += 1
                v.append(bytes(data[cursor:length + cursor]))
                cursor += length
            setattr(cls, meta.name, v)
        if meta.type_name == ListStruct().__class__:
            length = data[cursor]
            cursor += 1
            v = []
            for i in range(length):
                cursor_p = [cursor]
                child_cls = getattr(cls, meta.name)[0]
                v.append(serde_deserialize(
                    data, child_cls, cursor_p=cursor_p))
                cursor = cursor_p[0]
            setattr(cls, meta.name, v)
        if meta.type_name == Struct().__class__:
            child_cls = getattr(cls, meta.name)
            cursor_p = [cursor]
            setattr(cls, meta.name, serde_deserialize(
                    data, child_cls, cursor_p=cursor_p))
            cursor = cursor_p[0]
    cursor_p[0] = cursor
    return cls


if __name__ == '__main__':
    class child(Structure):
        a = Integer()
        b = Integer()

        def __init__(self, a: int, b: int) -> None:
            self.a = a
            self.b = b

    class Test(Structure):
        list1d = List1D()
        number = Integer()
        list2d = List2D()
        b = Bytes()
        ls = ListStruct()
        s = Struct()

        def __init__(self, number: int, list: list[int], list2d: list[list[int]], bytes: bytes) -> None:
            self.number = number
            self.list1d = list
            self.list2d = list2d
            self.b = bytes
            self.ls = [child(number, number)]
            self.s = child(number, number)

        @classmethod
        def new(self):
            return self(0, [], [], bytes([]))

    t = Test(1, [1, 2, 3], [[1, 2, 3], [4, 5, 6]], bytes.fromhex('01'))

    expect = [3, 1, 2, 3, 1, 2, 3, 1, 2, 3, 3, 4, 5, 6, 1, 1, 1, 1, 1, 1, 1]

    print(t.serde_serialize())
    assert t.serde_serialize() == expect, "serialize_error"

    t2 = Test.new()
    t2 = serde_deserialize(expect, t2)

    print(t2.to_str())
