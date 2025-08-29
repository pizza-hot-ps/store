[
  {
    "name": "عرض بيتزا دجاج XL",
    "code": "CHICKENXL",
    "type": "fixed",
    "value": 10,
    "condition": "isChickenPizza",
    "applyFn": "applyFixed",
    "priority": 5,
    "active": true,
    "source": "ترويجي"
  },
  {
    "name": "عرض العائلة",
    "code": "FAMILYSET",
    "type": "fixed",
    "value": 20,
    "condition": "isFamilyOrder",
    "applyFn": "applyFixed",
    "priority": 4,
    "active": true,
    "source": "ترويجي"
  },
  {
    "name": "عرض أجنحة الدجاج",
    "code": "WINGSDEAL",
    "type": "fixed",
    "value": 8,
    "condition": "hasWings",
    "applyFn": "applyFixed",
    "priority": 3,
    "active": true,
    "source": "ترويجي"
  },
  {
    "name": "خصم تلقائي رمزي",
    "type": "percentage",
    "value": 0.1,
    "condition": "alwaysTrue",
    "applyFn": "applyPercentage",
    "priority": 1,
    "active": true,
    "source": "تلقائي"
  }
]
