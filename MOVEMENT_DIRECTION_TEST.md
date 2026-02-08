# Movement and Facing Direction Verification

## Unit Behavior Specification

### Player Units (Left Base → Right Movement)
- **Spawn Position**: x = 100 + offset (left side)
- **Movement Direction**: RIGHT (positive velocity, direction = +1)
- **Sprite Facing**: RIGHT (scaleX = +0.15, scaleY = +0.15)
- **Target**: Enemy base at x = 5700 (right side)
- **Walk Vector**: x += speed * delta (POSITIVE)

### Enemy Units (Right Base → Left Movement)
- **Spawn Position**: x = 5700 - offset (right side)
- **Movement Direction**: LEFT (negative velocity, direction = -1)
- **Sprite Facing**: LEFT (scaleX = -0.15, scaleY = +0.15)
- **Target**: Player base at x = 100 (left side)
- **Walk Vector**: x -= speed * delta (NEGATIVE)

## Implementation Details

### Unit.js Constructor
```javascript
// Set facing based on team
if (this.isEnemy) {
  this.sprite.setScale(-0.15, 0.15);  // Face LEFT (negative scaleX)
} else {
  this.sprite.setScale(0.15, 0.15);   // Face RIGHT (positive scaleX)
}
```

### Unit.js Update Method
```javascript
// Move toward enemy side
const direction = this.isEnemy ? -1 : 1;  // Enemy: -1 (LEFT), Player: +1 (RIGHT)
this.x += direction * this.speed * (delta / 1000);
```

## Visual Verification Checklist
- [ ] Player knights spawn at left, walk right, face right
- [ ] Player archers spawn at left, walk right, face right
- [ ] Enemy warriors spawn at right, walk left, face left
- [ ] Enemy archers spawn at right, walk left, face left
- [ ] Units meet in middle and face each other during combat
- [ ] Attack animations lunge in correct direction (toward enemy)
- [ ] Death animations rotate in correct direction

## Critical Rule
**EVERY unit's sprite facing (scaleX sign) MUST match its movement direction**
- Positive velocity (+X) = Positive scaleX (face right)
- Negative velocity (-X) = Negative scaleX (face left)
