import { expect } from 'chai';
import { RequestValidator } from '../../ts/RequestValidator';
let validator: RequestValidator = null;
let expected: any = null;

function test(err: any): void {
    if (err) {
        expect(err.message).to.equal(expected);
    } else {
        expect(err).to.equal(expected);
    }
}

// tslint:disable no-http-string
describe('RequestValidator', () => {
    before(() => {
        validator = new RequestValidator();
        validator = new RequestValidator(Error);
    });

    it('RequestValidator::validate() empty', () => {
        expected = undefined;
        validator.validate({}, null, test);
        validator.validate({route: { validation: { url: null}}}, null, test);
        validator.validate({route: { validation: { url: { name: { type: 'string'}}}}}, null, test);
    });

    it('RequestValidator::validate() required', () => {
        expected = 'Url: Param id is required';
        validator.validate(
            {
                route: {
                    validation: {
                        url: {
                            name: {required: true}, // Will not throw an error because type is not defined
                            id: {type: 'number', required: true}
                        }
                    }
                }, params: {}
            },
            null, test
        );
    });

    // tslint:disable-next-line:max-func-body-length
    it('RequestValidator::validate() type', () => {
        expected = 'Url: Param id has invalid type (number)';
        validator.validate(
            {
                route: {
                    validation: {
                        url: {
                            id: {type: 'number'}
                        }
                    }
                }, params: {
                    id: 'foo'
                }
            },
            null, test
        );

        expected = 'Url: Param id has invalid type (numeric)';
        validator.validate(
            {
                route: {
                    validation: {
                        url: {
                            id: {type: 'numeric'}
                        }
                    }
                }, params: {
                    id: 'foo'
                }
            },
            null, test
        );

        expected = 'Url: Param foo has invalid type (boolean)';
        validator.validate(
            {
                route: {
                    validation: {
                        url: {
                            foo: {type: 'boolean'}
                        }
                    }
                }, params: {
                    foo: 'bar'
                }
            },
            null, test
        );

        expected = undefined;
        validator.validate(
            {
                route: {
                    validation: {
                        query: {
                            name: {type: 'string', required: false},
                            id: {type: 'numeric', required: false}
                        }
                    }
                }, query: {
                    id: '5'
                }
            },
            null, test
        );

        expected = 'Url: Param categories has invalid content type (number[])';
        validator.validate(
            {
                route: {
                    validation: {
                        url: {
                            designers: {type: 'array', required: true, arrayType: 'numeric'},
                            categories: {type: 'array', required: true, arrayType: 'number'}
                        }
                    }
                }, params: {
                    designers: '1,2',
                    categories: 'foo,1'
                }
            },
            null, test
        );

        expected = 'Body: Param categories must have a minimum length of 1';
        validator.validate(
            {
                route: {
                    validation: {
                        body: {
                            categories: {type: 'array', required: false, arrayType: 'number'}
                        }
                    }
                }, body: {
                    categories: []
                }
            },
            null, test
        );

        expected = 'Body: Param createdAt has invalid type (date)';
        validator.validate(
            {
                route: {
                    validation: {
                        body: {
                            createdAt: {type: 'date', required: true}
                        }
                    }
                }, body: {
                    createdAt: 'foo'
                }
            },
            null, test
        );

        expected = undefined;
        validator.validate(
            {
                route: {
                    validation: {
                        body: {
                            createdAt: {type: 'date', required: true}
                        }
                    }
                }, body: {
                    createdAt: '2016-09-01T18:29:25.642Z'
                }
            },
            null, test
        );
    });

    it('RequestValidator::validate() date', () => {
        const date: string = '2016-10-06T16:32:39.246Z';
        const req: any = {
            route: {
                validation: {
                    body: {
                        startedAt: {type: 'date'}
                    }
                }
            }, body: {
                startedAt: date
            }
        };

        validator.validate(req, null, (err: any) => {
            expect(err).to.equal(undefined, 'Error should be undefined');
            expect(typeof req.body.startedAt).to.be.equal('object');
            expect(typeof req.body.startedAt.getTime).to.be.equal('function');
            expect(req.body.startedAt.getTime()).to.be.equal(Date.parse(date));

            // double date validation
            validator.validate(req, null, (e: any) => {
                expect(e).to.equal(undefined, 'Error should be undefined');
                expect(typeof req.body.startedAt).to.be.equal('object');
                expect(typeof req.body.startedAt.getTime).to.be.equal('function');
                expect(req.body.startedAt.getTime()).to.be.equal(Date.parse(date));
            });
        });
    });

    it('RequestValidator::validate() number', () => {
        expected = undefined;
        validator.validate(
            {
                route: {
                    validation: {
                        query: {
                            id: {type: 'number', required: false}
                        }
                    }
                }, query: {}
            },
            null, test
        );
    });

    it('RequestValidator::validate() numeric', () => {
        expected = undefined;
        validator.validate(
            {
                route: {
                    validation: {
                        query: {
                            id: {type: 'numeric', required: false}
                        }
                    }
                }, query: {id: '1'}
            },
            null, test
        );
        expected = undefined;
        validator.validate(
            {
                route: {
                    validation: {
                        query: {
                            id: {type: 'numeric', required: false, min: 0}
                        }
                    }
                }, query: {id: '0'}
            },
            null, test
        );
    });

    it('RequestValidator::validate() null values', () => {
        expected = undefined;
        validator.validate(
            {
                route: {
                    validation: {
                        body: {
                            id: {type: 'number', required: false, min: 0}
                        }
                    }
                }, body: {
                    id: null
                }
            },
            null, test
        );

        expected = undefined;
        validator.validate(
            {
                route: {
                    validation: {
                        body: {
                            comments: {type: 'string', required: false}
                        }
                    }
                }, body: {
                    comments: null
                }
            },
            null, test
        );

        expected = 'Body: Param comments is required';
        validator.validate(
            {
                route: {
                    validation: {
                        body: {
                            comments: {type: 'string', required: true}
                        }
                    }
                }, body: {
                    comments: null
                }
            },
            null, test
        );
    });

    it('RequestValidator::validate() array in query with empty value', () => {
        expected = 'Query: Param category_id is required';
        validator.validate(
            {
                route: {
                    validation: {
                        query: {
                            category_id: {type: 'array', arrayType: 'numeric', required: true}
                        }
                    }
                }, query: {
                    category_id: ''
                }
            },
            null, test
        );
    });

    it('RequestValidator::validate() min', () => {
        expected = 'Query: Param id must have a minimum length of 2';
        validator.validate(
            {
                route: {
                    validation: {
                        query: {
                            id: {type: 'number', required: true, min: 2}
                        }
                    }
                }, query: {
                    id: 1
                }
            },
            null, test
        );

        expected = 'Query: Param name must have a minimum length of 4';
        validator.validate(
            {
                route: {
                    validation: {
                        query: {
                            name: {type: 'string', required: true, min: 4}
                        }
                    }
                }, query: {
                    name: 'foo'
                }
            },
            null, test
        );

        expected = undefined;
        validator.validate(
            {
                route: {
                    validation: {
                        body: {
                            enabled: {type: 'boolean', required: true}
                        }
                    }
                }, body: {
                    enabled: true
                }
            },
            null, test
        );
    });

    it('RequestValidator::validate() max', () => {
        expected = 'Query: Param id must have a maximum length of 2';
        validator.validate(
            {
                route: {
                    validation: {
                        query: {
                            name: {type: 'string', required: false, max: 3},
                            id: {type: 'numeric', required: true, max: 2}
                        }
                    }
                }, query: {
                    id: '3'
                }
            },
            null, test
        );

        expected = 'Query: Param name must have a maximum length of 2';
        validator.validate(
            {
                route: {
                    validation: {
                        query: {
                            designers: {type: 'array', required: true, max: 3},
                            enabled: {type: 'boolean', required: true, max: 2},
                            name: {type: 'string', required: true, max: 2}
                        }
                    }
                }, query: {
                    name: 'foo',
                    designers: '1,foo',
                    enabled: false
                }
            },
            null, test
        );
    });

    it('RequestValidator::validate() length', () => {
        expected = 'Query: Param designers must have a length of 2';
        validator.validate(
            {
                route: {
                    validation: {
                        query: {
                            id: {type: 'numeric', required: true, length: 3},
                            name: {type: 'string', required: false, length: 4},
                            description: {type: 'string', required: true, length: 3},
                            enabled: {type: 'boolean', required: true, length: 10},
                            designers: {type: 'array', required: true, length: 2}
                        }
                    }
                }, query: {
                    id: '3456',
                    description: 'foo',
                    designers: '1,3,9',
                    enabled: true
                }
            },
            null, test
        );
    });

    it('RequestValidator::validate() values', () => {
        expected = 'Query: Param gender must belong to [men,women]';
        validator.validate(
            {
                route: {
                    validation: {
                        query: {
                            with: {type: 'array', required: true, values: ['men', 'women']},
                            gender: {type: 'string', required: true, values: ['men', 'women']}
                        }
                    }
                }, query: {
                    with: 'men,men',
                    gender: 'foo'
                }
            },
            null, test
        );

        expected = 'Query: Param with must belong to [men,women]';
        validator.validate(
            {
                route: {
                    validation: {
                        query: {
                            with: {type: 'array', required: true, values: ['men', 'women']}
                        }
                    }
                }, query: {
                    with: 'men,foo'
                }
            },
            null, test
        );
    });

    it('RequestValidator::validate() regex', () => {
        expected = 'Url: Param latlng must match regex /[-+]?\\d*\\.\\d*,[-+]?\\d*\\.\\d*/';
        validator.validate(
            {
                route: {
                    validation: {
                        url: {
                            latlng: {type: 'string', required: true, regex: /[-+]?\d*\.\d*,[-+]?\d*\.\d*/}
                        }
                    }
                }, params: {
                    latlng: 'foo'
                }
            },
            null, test
        );
    });

    it('RequestValidator::validate() format', () => {
        expected = undefined;
        const req: any = {
            language: 'fr',
            count: 1
        };
        validator.validate(
            {
                route: {
                    validation: {
                        url: {
                            language: {type: 'string', required: true, format: (v: string): string => v.toUpperCase() },
                            count: {type: 'number', required: true, format: (v: number): number => v + 1 }
                        }
                    }
                },
                params: req
            },
            null, test
        );

        expect(req.language).to.equal('FR');
        expect(req.count).to.equal(2);
    });

    it('RequestValidator::validate() boolean', () => {
        expected = undefined;
        validator.validate(
            {
                route: {
                    validation: {
                        body: {
                            enabled: {type: 'boolean', required: true}
                        }
                    }
                }, body: {
                    enabled: 'true'
                }
            },
            null, test
        );

        validator.validate(
            {
                route: {
                    validation: {
                        body: {
                            enabled: {type: 'boolean', required: true}
                        }
                    }
                }, body: {
                    enabled: '0'
                }
            },
            null, test
        );

        validator.validate(
            {
                route: {
                    validation: {
                        body: {
                            enabled: {type: 'boolean', required: true}
                        }
                    }
                }, body: {
                    enabled: 0
                }
            },
            null, test
        );
    });

    it('RequestValidator with failOnFirstError=false', () => {
        validator.disableFailOnFirstError();

        expected = 'Query: Param description is required\nQuery: Param enabled is required\n'
            + 'Query: Param designers must have a length of 2\nQuery: Param categories is required';
        validator.validate(
            {
                route: {
                    validation: {
                        query: {
                            id: {type: 'numeric', required: true, length: 3},
                            name: {type: 'string', required: false, length: 4},
                            description: {type: 'string', required: true, length: 3},
                            enabled: {type: 'boolean', required: true, length: 10},
                            designers: {type: 'array', required: true, length: 2},
                            categories: {type: 'array', required: true, length: 2, regex: /\d/},
                            countryCode: {type: 'string', required: false, regex: /^[A-Za-z]{2}$/}
                        }
                    }
                }, query: {
                    id: '3456',
                    designers: '1,3,9'
                }
            },
            null, test
        );
    });

    it('RequestValidator with terminal=true', () => {
        validator.disableFailOnFirstError();

        expected = 'Query: Param name is required';
        validator.validate(
            {
                route: {
                    validation: {
                        query: {
                            id: {type: 'numeric', required: true, length: 3},
                            name: {type: 'string', required: true, length: 4, terminal: true},
                            description: {type: 'string', required: true, length: 3}
                        }
                    }
                }, query: {
                    id: 'bc',
                    description: '-'
                }
            },
            null, test
        );
    });

    it('RequestValidator with terminal=[given constraints]', () => {
        validator.disableFailOnFirstError();

        expected = 'Query: Param description has invalid type (numeric)\n' +
            'Query: Param description must have a length of 3';
        validator.validate(
            {
                route: {
                    validation: {
                        query: {
                            id: {type: 'numeric', required: true, length: 3},
                            name: {type: 'string', required: true, length: 4},
                            description: {type: 'numeric', required: true, length: 3, terminal: ['type', 'length']}
                        }
                    }
                }, query: {
                    id: 'bc',
                    description: '--'
                }
            },
            null, test
        );
    });

    it('RequestValidator with terminal=[given constraints on multiple fields]', () => {
        validator.disableFailOnFirstError();

        expected = 'Query: Param description has invalid type (numeric)\n' +
            'Query: Param description must have a length of 3';
        validator.validate(
            {
                route: {
                    validation: {
                        query: {
                            id: {type: 'numeric', required: true, length: 3, terminal: true},
                            name: {type: 'string', required: true, length: 4},
                            description: {type: 'numeric', required: true, length: 3, terminal: ['type', 'length']}
                        }
                    }
                }, query: {
                    id: 123,
                    description: '--'
                }
            },
            null, test
        );
    });

    it('RequestValidator with terminal=[given constraints on multiple fields] first terminal executed', () => {
        validator.disableFailOnFirstError();

        expected = 'Query: Param id is required';
        validator.validate(
            {
                route: {
                    validation: {
                        query: {
                            id: {type: 'numeric', required: true, length: 3, terminal: true},
                            name: {type: 'string', required: true, length: 4},
                            description: {type: 'numeric', required: true, length: 3, terminal: ['type', 'length']}
                        }
                    }
                }, query: {
                    description: '--'
                }
            },
            null, test
        );
    });

    it('RequestValidator with terminal=[given constraints] no terminal error', () => {
        validator.disableFailOnFirstError();

        expected = 'Query: Param id must have a minimum length of 1000\n' +
            'Query: Param name must have a length of 4';
        validator.validate(
            {
                route: {
                    validation: {
                        query: {
                            id: {type: 'numeric', required: true, length: 3, min: 1000, terminal: ['type', 'length']},
                            name: {type: 'string', required: true, length: 4},
                            description: {type: 'numeric', required: true, length: 3}
                        }
                    }
                }, query: {
                    id: '123',
                    name: 'abc',
                    description: '1234'
                }
            },
            null, test
        );
    });

    describe('Disallow extra fields', () => {
        it('Should not allow extra fields (body)', () => {
            expected = 'Body: Should not contain extra fields (forbiddenOther, forbiddenAnother)';
            validator.validate(
                {
                    route: {
                        validation: {
                            body: {
                                allowedField: {type: 'boolean', required: true},
                                disallowExtraFields: true
                            }
                        }
                    },
                    body: {
                        allowedField: true,
                        forbiddenOther: 'foo',
                        forbiddenAnother: 'foo'
                    }
                },
                null,
                test
            );
        });

        it('Should not allow extra fields (url)', () => {
            expected = 'Url: Should not contain extra fields (oneForbidden)';
            validator.validate(
                {
                    route: {
                        validation: {
                            url: {
                                allowedField: {type: 'boolean', required: true},
                                disallowExtraFields: true
                            }
                        }
                    },
                    params: {
                        allowedField: true,
                        oneForbidden: 'foo'
                    }
                },
                null,
                test
            );
        });

        it('Should not allow extra fields (query)', () => {
            expected = 'Query: Should not contain extra fields (oneForbidden)';
            validator.validate(
                {
                    route: {
                        validation: {
                            query: {
                                allowedField: {type: 'boolean', required: true},
                                disallowExtraFields: true
                            }
                        }
                    },
                    query: {
                        allowedField: true,
                        oneForbidden: 'foo'
                    }
                },
                null,
                test
            );
        });

        it('Should handle custom error messages', () => {
            expected = 'Payload contains forbidden data';
            validator.validate(
                {
                    route: {
                        validation: {
                            query: {
                                allowedField: {type: 'boolean', required: true},
                                disallowExtraFields: true
                            }
                        },
                        validationMessages: {
                            disallowExtraFields: {
                                default: expected
                            }
                        }
                    },
                    query: {
                        allowedField: true,
                        oneForbidden: 'foo'
                    }
                },
                null,
                test
            );
        });

        it('Should succeed given correct fields', () => {
            expected = undefined;
            validator.validate(
                {
                    route: {
                        validation: {
                            query: {
                                allowedField: {type: 'boolean', required: true},
                                disallowExtraFields: true
                            }
                        }
                    },
                    query: {
                        allowedField: true
                    }
                },
                null,
                test
            );
        });

        it('Should not be active when disallowExtraFields=false', () => {
            expected = undefined;
            validator.validate(
                {
                    route: {
                        validation: {
                            query: {
                                allowedField: {type: 'boolean', required: true},
                                disallowExtraFields: false
                            }
                        }
                    },
                    query: {
                        allowedField: true,
                        oneForbidden: 'foo'
                    }
                },
                null,
                test
            );
        });
    });

    describe('Custom Error Messages', () => {
        it('required', () => {
            expected = 'The name is required';
            validator.validate(
                {
                    route: {
                        validation: {
                            url: {
                                name: {type: 'string', required: true, min: 3}
                            }
                        },
                        validationMessages: {
                            name: {
                                type: 'The name must be a string',
                                required: 'The name is required',
                                min: 'The name must have a minimum length of 3 characters'
                            }
                        }
                    }, url: {
                        name: ''
                    }
                },
                null, test
            );
        });

        it('arrayType', () => {
            expected = 'Categories must be an array of numbers';
            validator.validate(
                {
                    route: {
                        validation: {
                            query: {
                                categories: {type: 'array', required: true, arrayType: 'number'}
                            }
                        },
                        validationMessages: {
                            categories: {
                                arrayType: 'Categories must be an array of numbers'
                            }
                        }
                    }, query: {
                        categories: '2,a'
                    }
                },
                null, test
            );
        });

        it('regex', () => {
            expected = 'Website must start with http://';
            validator.validate(
                {
                    route: {
                        validation: {
                            body: {
                                website: {type: 'string', required: true, regex: /^http:\/\//}
                            }
                        },
                        validationMessages: {
                            website: {
                                regex: 'Website must start with http://'
                            }
                        }
                    }, body: {
                        website: 'test'
                    }
                },
                null, test
            );
        });

        it('min/max/length/values with failOnFirstError=false', () => {
            validator.disableFailOnFirstError();

            // tslint:disable-next-line:max-line-length
            expected = 'Description must have a length >= 2\nSEO Keyword must have a length <= 2\nDesigners must have a length = 2\nDesigners must be either 1 or 2';
            validator.validate(
                {
                    route: {
                        validation: {
                            query: {
                                id: {type: 'numeric', required: true, length: 3},
                                name: {type: 'string', required: false, length: 4},
                                description: {type: 'string', required: true, min: 2},
                                seo_keyword: {type: 'string', required: true, max: 2},
                                designers: {type: 'array', required: true, length: 2, values: ['1', '2']}
                            }
                        },
                        validationMessages: {
                            description: {
                                min: 'Description must have a length >= 2'
                            },
                            seo_keyword: {
                                max: 'SEO Keyword must have a length <= 2'
                            },
                            designers: {
                                length: 'Designers must have a length = 2',
                                values: 'Designers must be either 1 or 2'
                            }
                        }
                    }, query: {
                        id: '3456',
                        description: 'a',
                        seo_keyword: 'abcd',
                        designers: '1,3,9'
                    }
                },
                null, test
            );
        });

        it('RequestValidator::validate() should convert to respective types', () => {
            const body: any = {
                id: '3456',
                description: 'aaaa',
                startDate: '2019-06-21',
                numberList: ['1', '3', '9'],
                priceList: ['1.78', '3.49', '9.6987'],
                intList: ['1.78', '3.49', '9.6987'],
                multDimension: [
                    '1.78',
                    '3.49',
                    [
                        '9.6987',
                        [
                            '17',
                            '21.8888',
                            '1.7'
                        ],
                        '58.7'
                    ]
                ],
                doubleValue: '154.784987',
                integerVal: '154.98'
            };
            expected = undefined;
            validator.validate(
                {
                    route: {
                        validation: {
                            body: {
                                id: {type: 'integer', required: true, length: 3},
                                description: {type: 'string', required: true, min: 2},
                                startDate: {type: 'date', required: true },
                                numberList: {type: 'array', required: true, arrayType: 'numeric'},
                                priceList: {type: 'array', required: true, arrayType: 'number'},
                                intList: {type: 'array', required: true, arrayType: 'integer'},
                                multDimension: {type: 'array', required: true, arrayType: 'number'},
                                doubleValue: {type: 'numeric', required: true},
                                integerVal: { type: 'integer', required: true}
                            }
                        }
                    },
                    body
                },
                null,
                test
            );

            expect(body).to.deep.equal({
                id: 3456,
                description: 'aaaa',
                startDate: new Date('2019-06-21'),
                numberList: [1, 3, 9],
                priceList: [1.78, 3.49, 9.6987],
                intList: [1, 3, 9],
                multDimension: [1.78, 3.49, [9.6987, [17, 21.8888, 1.7], 58.7]],
                doubleValue: 154.784987,
                integerVal: 154
            });
        });
    });
});
