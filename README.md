# imgry v1.0.0
Vanilla JS library that's all about images: lazy loading, spacer generating, svg to inline...

**📦 ARCHIEVED:** in favor of https://github.com/stamat/lazyloaded and https://github.com/stamat/book-of-spells

## Functions
Function | Params | Description
-------- | ------ | -----------
`imgry.load` |  `url <string>`, `callback(url) <fn>` | Loads an image from provided URL and upon load event fires a callback
 `imgry.closest` |  `arr <array:nums>`, `goal <num>` | Not related to images, finds the closest number in array of numbers to the goal

## Classes
### LazySpacers
### LazyLoader
Why not use lazy-load? Not to create a dependancy for something trivial like IntersectionObserver. Also I would like to take this at a direction of module which will autogenerate html wrappers
